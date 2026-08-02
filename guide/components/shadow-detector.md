---
title: API Shadow Detector
description: Discover how ATRVASA passively inspects L7 traffic using eBPF ring buffers to infer OpenAPI schemas and detect undocumented endpoints.
---

# API Shadow Detector

In modern microservice architectures, developers frequently deploy new endpoints, deprecate old ones, or expose internal debugging routes. When these changes bypass standard API Gateways or documentation processes, they become **Shadow APIs** (or Zombie APIs)—representing a massive blind spot and a critical security risk.

Traditional discovery tools require routing traffic through an inline proxy (introducing latency) or relying on static code analysis. The **ATRVASA API Shadow Detector** takes a fundamentally different, zero-overhead approach using passive eBPF telemetry.

## How It Works: The Passive Telemetry Pipeline

The Shadow Detector operates in parallel with the [Firewall Engine](./firewall), observing traffic without actively modifying or delaying the packet flow.

### 1. In-Kernel L7 Parsing (TC Hooks)
eBPF programs attached to the Traffic Control (TC) `clsact` qdisc (both ingress and egress queues) inspect the `sk_buff` payload as packets traverse the kernel. 
* The kernel-space parser safely scans the byte stream for HTTP/1.1, HTTP/2, or gRPC protocol signatures.
* It extracts critical metadata: HTTP Method (`GET`, `POST`), URI Paths (`/api/v2/users`), Host headers, and User-Agents.

### 2. Lockless Ring Buffers (`BPF_MAP_TYPE_RINGBUF`)
To send this telemetry data to user-space without bottlenecking the kernel, ATRVASA utilizes eBPF Ring Buffers. 
Unlike older `perf` buffers, the eBPF Ring Buffer provides a high-performance, shared memory queue across all CPUs. The kernel simply pushes the parsed L7 metadata struct into this queue and immediately releases the packet to the application layer.

### 3. Asynchronous User-Space Processing (Rust)
The ATRVASA Rust daemon runs a dedicated, highly concurrent Tokio async task that continuously polls the Ring Buffer. 
Because the heavy lifting of packet parsing was done in the kernel, the user-space daemon only receives lightweight, structured event data.

```text
[ Microservice App ]
        ^
        | (Packet Flow)
        v
 +-------------------+      1. Extract      +-----------------------+
 | eBPF TC Hook      | ===================> | eBPF Ring Buffer      |
 | (Passive Sniff)   |    L7 Metadata       | (High-Speed Queue)    |
 +-------------------+                      +-----------+-----------+
                                                        |
                                                        | 2. Async Poll
                                                        v
                                            +-----------------------+
                                            | Rust Control Plane    |
                                            | (Schema Inference &   |
                                            |  Anomaly Detection)   |
                                            +-----------------------+

```

## Schema Inference & OpenAPI Generation

As the Rust control plane consumes the stream of L7 events, it builds a dynamic, real-time map of your microservice topology.

* **Pattern Matching:** It collapses variable path parameters (e.g., `/api/users/123` and `/api/users/456` become `/api/users/{id}`).
* **Schema Construction:** It aggregates observed methods and headers to infer the actual API contract being utilized in production.
* **Export:** Administrators can export this inferred baseline directly into an **OpenAPI (Swagger) v3** format using the `atrvasa shadow export` CLI command.

## Detecting Anomalies (The "Shadow" Alert)

The true power of this component lies in anomaly detection. You can provide the ATRVASA daemon with a "Known Good" OpenAPI specification or a YAML configuration of approved routes.

As live traffic streams in, the Rust engine compares the observed traffic against the known baseline. If a microservice receives a request to an undocumented endpoint (e.g., `POST /api/v1/legacy-auth`), the detector immediately flags it as a **Shadow API**.

Depending on your configuration, this event can:

1. Generate an urgent alert in your observability stack (via stdout or Grafana integrations).
2. Dynamically feed back into the [Embedded OPA Engine](https://www.google.com/search?q=./opa-engine) to automatically generate a blocking rule in the firewall, closing the vulnerability in real-time.
