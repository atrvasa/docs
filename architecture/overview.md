---
title: Architecture Overview
description: Deep dive into the ATRVASA control-plane and data-plane, detailing eBPF hooks, maps, and Rust interoperability.
---

# Architecture Overview

The ATRVASA architecture is strictly divided into two operational planes: the **Kernel-Space Data Plane** (implemented in eBPF C/Rust) and the **User-Space Control Plane** (implemented in native Rust). This separation ensures that performance-critical packet processing happens with zero overhead in the kernel, while complex policy compilation and state management occur safely in user-space.

---

## High-Level Topology

At its core, ATRVASA relies on the **Aya** library (or `libbpf-rs`) to compile, load, and attach eBPF programs natively from Rust, avoiding the need for heavy C-toolchain dependencies in the runtime environment.

| Component | Space | Primary Responsibility | Key Technology |
| :--- | :--- | :--- | :--- |
| **Firewall / Router** | Kernel | Packet filtering, Socket bypassing, Identity check | eBPF (TC, SockOps, SK_SKB) |
| **Telemetry Node** | Kernel | Passive traffic cloning and header parsing | eBPF (Ring Buffer) |
| **Control Plane** | User | Lifecycle management, eBPF Map synchronization | Rust (Tokio, Aya) |
| **OPA Engine** | User | Policy compilation (YAML/Rego to Map binary data) | Rust Native |
| **Shadow Detector**| User | Schema inference, OpenAPI generation, Alerting | Rust (Serde, Async Streams)|

---

## The Data Plane: eBPF Kernel Operations

The data plane is designed for extreme efficiency. It intercepts network traffic at various stages of the Linux network stack using specific eBPF hook points.

### 1. eBPF Hook Points

* **`BPF_PROG_TYPE_SOCK_OPS` & `BPF_PROG_TYPE_SK_SKB` (Socket Bypassing):**
    Instead of allowing packets to traverse the entire TCP/IP stack (L4 down to L2 and back up), ATRVASA intercepts connection establishments (`BPF_SOCK_OPS_ACTIVE_ESTABLISHED_CB`). It maps the socket pair into a `BPF_MAP_TYPE_SOCKMAP`. Subsequent packets are directly redirected from the sender's socket buffer to the receiver's socket buffer (`sk_msg`), bypassing the lower networking layers entirely.
* **`BPF_PROG_TYPE_SCHED_ACT` (Traffic Control - TC):**
    For traffic leaving the node or requiring deep packet inspection (L7 HTTP/gRPC parsing), programs are attached to the `clsact` qdisc (ingress/egress). Here, the eBPF program parses protocol headers, extracts metadata (e.g., HTTP Host, URI), and enforces Zero-Trust ACLs before the packet reaches the application layer.

### 2. eBPF Maps & State Management

Communication between the kernel and user-space relies on specific eBPF map types:

* **Policy Hash Maps (`BPF_MAP_TYPE_HASH` / `BPF_MAP_TYPE_LPM_TRIE`):** Stores allowed IP subnets, expected SPIFFE IDs, and port restrictions. The Rust control plane writes to these maps, and the eBPF programs perform constant-time `O(1)` or logarithmic lookups to determine packet verdicts (DROP/PASS).
* **Socket Maps (`BPF_MAP_TYPE_SOCKHASH`):** Maintains active socket references for local microservice-to-microservice communication, enabling the zero-copy bypass.
* **Telemetry Ring Buffers (`BPF_MAP_TYPE_RINGBUF`):** A high-performance, lockless structure used by the Shadow API Detector. The eBPF program writes parsed L7 metadata (Method, Path, Headers) into the buffer, which the Rust async runtime aggressively polls and processes.

---

## The Control Plane: Rust User-Space

The user-space daemon orchestrates the Zero-Trust ecosystem securely and efficiently.

### Embedded OPA Policy Compiler
Traditional OPA (Open Policy Agent) runs as a separate sidecar. ATRVASA embeds a lightweight, Rust-native OPA evaluator. 
1. The user defines a high-level policy (e.g., *"Service A can POST to Service B on /api/v1/data"*).
2. The OPA engine parses this declarative intent.
3. It translates the intent into binary byte-arrays.
4. It safely injects these byte-arrays into the respective eBPF Policy Maps via `bpf()` syscalls.

### Shadow API Inference Engine
This async worker listens to the `BPF_MAP_TYPE_RINGBUF`. 
* **Stream Processing:** It reads raw packet metadata streams pushed by the kernel.
* **Reconstruction:** It reconstructs the API call paths and payload shapes.
* **Comparison:** It compares the inferred schema against a known baseline (e.g., an existing Swagger file). If a mismatch occurs, it flags an anomaly (Shadow API detected).

---

## Packet Lifecycle & Decision Flow

When a packet is initiated by a microservice (e.g., Pod A -> Pod B):

1. **Intercept:** The `sock_ops` program triggers on `connect()`.
2. **Policy Lookup:** eBPF queries the Policy Map. 
    * *If Unauthorized:* Connection is actively rejected in kernel (`TCP RST`).
    * *If Authorized:* The socket descriptor is added to the `sock_map`.
3. **Redirection (Zero-Copy):** Data sent on the socket is intercepted by the `sk_msg` program and directly written to Pod B's receive buffer.
4. **Telemetry Cloning:** Simultaneously, L7 metadata is cloned and pushed to the `ringbuf` for the Shadow API Detector to analyze, without pausing the actual data transfer.