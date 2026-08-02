---
title: Sidecarless Architecture
description: Understanding the shift from traditional proxy sidecars to eBPF-native, zero-overhead kernel enforcement.
---

# Sidecarless Architecture

To understand the core value of ATRVASA, it is essential to look at the evolution of cloud-native networking and why the traditional **Sidecar Proxy** model is becoming a performance bottleneck in modern, high-throughput microservice environments.

ATRVASA fundamentally rejects the sidecar paradigm, opting instead for a **Sidecarless, eBPF-native** architecture.
 
## The Legacy Approach: The Proxy Sidecar

In traditional Service Meshes (e.g., Istio, Linkerd), every application pod is injected with a proxy container (usually Envoy). All incoming and outgoing traffic for that application must pass through this proxy.

While this allows for rich routing and observability, the architectural cost is massive.

### The "Latency Tax" of User-Space Proxies

When `Pod A` communicates with `Pod B` on the same node using a sidecar model, the network packet must traverse the OS kernel's TCP/IP stack multiple times, crossing the expensive boundary between Kernel-space and User-space:

1. `Pod A App` writes data to socket (User-space -> Kernel-space).
2. Packet traverses TCP/IP stack to `veth` interface.
3. Packet is routed via iptables to `Pod A Proxy` (Kernel-space -> User-space).
4. `Pod A Proxy` processes L7 headers, applies mTLS, and sends it out (User-space -> Kernel-space).
5. Packet hits the physical NIC / host routing layer.
6. Packet is routed to `Pod B Proxy` (Kernel-space -> User-space).
7. `Pod B Proxy` decrypts and verifies, sending to local loopback (User-space -> Kernel-space).
8. Finally, `Pod B App` reads the packet (Kernel-space -> User-space).

**Result:** High CPU utilization, increased memory footprint per pod, and significant latency amplification.


## The ATRVASA Approach: eBPF Direct Routing

ATRVASA completely removes the user-space proxy. Instead of intercepting traffic at the pod level using iptables and user-space daemons, ATRVASA attaches eBPF programs directly to the lowest levels of the Linux kernel network stack (`TC` and `Socket` layers).

### 1. Socket Bypassing (Zero-Copy)
For intra-node microservice communication, ATRVASA uses `BPF_PROG_TYPE_SOCK_OPS` and `BPF_PROG_TYPE_SK_SKB`. 

When a socket connection is established, eBPF maps the socket descriptors into a `sockhash` map. When data is sent, the eBPF `sk_msg` program intercepts it directly in the socket buffer and redirects it to the destination socket buffer. **The packet never traverses the TCP/IP stack.**

```text
[Pod A App] ==============================================> [Pod B App]
  (User-space)                                                (User-space)
       |                                                           ^
       v                                                           |
  [Socket Send Buffer] ----> (eBPF sk_msg Redirect) ----> [Socket Receive Buffer]
  (Kernel-space)               (Zero-Copy transfer)           (Kernel-space)

```

### 2. High-Performance L4/L7 Enforcement

Instead of a proxy parsing HTTP headers in user-space, ATRVASA's eBPF programs attached to the Traffic Control (`clsact` qdisc) layer inspect the packet bytes dynamically.
Policy verdicts (PASS/DROP) are evaluated in `O(1)` time using eBPF Hash Maps managed by the Rust control plane.

## Key Benefits of Sidecarless Design

* **Sub-millisecond Latency:** By avoiding context switches and bypassing the TCP/IP stack for local traffic, network latency is practically reduced to raw memory copy speeds.
* **Radical Resource Efficiency:** No more reserving 100MB+ of RAM and dedicated CPU cycles for sidecars in every single pod. The kernel handles the routing natively.
* **Universal Visibility:** A sidecar only sees what is routed to it. eBPF sits at the kernel boundary, meaning it detects *all* traffic, including shadow APIs and unauthorized outgoing connections that a misconfigured sidecar might miss.
