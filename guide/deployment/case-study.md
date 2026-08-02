---
title: Interoperability Case Study
description: A real-world scenario demonstrating the ATRVASA eBPF firewall, embedded OPA engine, and Shadow API detector working in unison.
---

# Case Study: The Interoperability Scenario

To truly understand the power of the ATRVASA ecosystem, we must look beyond individual components. This case study demonstrates how the **eBPF Firewall**, **Shadow API Detector**, and **Embedded OPA Engine** operate as a unified, closed-loop security system in a modern Kubernetes microservice architecture.

## The Environment Setup

Imagine a standard cloud-native application (e.g., an e-commerce platform) deployed in a Kubernetes cluster. We have three primary microservices:

1. **`frontend-svc`**: The user-facing web application.
2. **`payment-api`**: The core backend service handling transactions.
3. **`legacy-auth`**: An old, undocumented, and supposedly deprecated authentication service that developers forgot to remove (A classic Zombie API).

ATRVASA is deployed as a DaemonSet on the worker nodes, with its eBPF programs attached to the host's `eth0` and container `veth` interfaces.

## The Scenario: A Closed-Loop Security Response

### Phase 1: Passive Discovery (The Shadow API Detector)

The system begins in a monitoring state. The `frontend-svc` communicates legitimately with the `payment-api`. The eBPF data-plane bypasses the TCP/IP stack for these local sockets (Zero-Copy), ensuring maximum throughput.

Suddenly, a compromised pod (or a misconfigured developer script) attempts to send an HTTP `POST` request to the undocumented `legacy-auth` service:

```bash
# Executed from a rogue container
curl -X POST [http://legacy-auth.svc.cluster.local/api/v1/debug-login](http://legacy-auth.svc.cluster.local/api/v1/debug-login)

```

1. The packet hits the **TC `clsact` eBPF Hook**.
2. The kernel extracts the L7 metadata (`POST`, `/api/v1/debug-login`, `Host: legacy-auth`).
3. The metadata is instantly pushed into the **eBPF Ring Buffer**.
4. The Rust control plane reads the event. Comparing this against the known OpenAPI baseline, it immediately flags this as an anomaly.

**Console Output:**

```text
[SHADOW_API] ⚠️ ALERT: Unmapped endpoint accessed! 
Source: 10.244.1.5 (rogue-pod) -> Target: 10.244.1.9 (legacy-auth)
Payload: POST /api/v1/debug-login

```

### Phase 2: Dynamic Policy Evaluation (Embedded OPA Engine)

Instead of just alerting a Slack channel and waiting for a human engineer, ATRVASA takes automated action.

The Shadow API module forwards the anomalous context to the **Embedded Rust OPA Engine**. The engine evaluates the cluster's base Zero-Trust configuration, which dictates that *any access to unmapped internal APIs from untrusted sources must be quarantined*.

The OPA Engine dynamically compiles a new restriction rule:

* **Target IP:** `10.244.1.9` (legacy-auth)
* **L7 Path:** `/api/v1/debug-login`
* **Action:** `DROP`

### Phase 3: Kernel-Level Enforcement (eBPF Firewall)

With the new rule compiled into a binary format, the Rust daemon executes a `bpf()` syscall to atomically update the **eBPF Hash Maps** pinned in the kernel.

```text
[OPA_ENGINE] ⚡ Policy Compiled: Rule ID #892A generated.
[CONTROL_PLANE] 🔒 Map Updated: Injected Rule #892A into kernel BPF_MAP_TYPE_HASH.

```

When the rogue pod attempts a second `POST` request just milliseconds later:

1. The packet hits the **XDP or TC Hook**.
2. The eBPF program performs an `O(1)` lookup in the updated Hash Map.
3. It finds a matching drop rule for the tuple and URI.
4. The kernel returns `XDP_DROP` or `TC_ACT_SHOT`.

**Console Output:**

```text
[FIREWALL] 🛑 DROP: POST /api/v1/debug-login (Rule: Auto-Quarantine) - Latency: 14μs

```

## Conclusion

Within milliseconds, ATRVASA detected a hidden vulnerability, evaluated the risk against declarative policies, and enforced a network-level block—all without requiring a heavy user-space proxy like Envoy, and without interrupting legitimate traffic between the `frontend-svc` and `payment-api`.

This is the essence of **Zero-Overhead, Zero-Trust Observability**. 