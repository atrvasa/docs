---
title: eBPF Hooks & Kernel Bypass
description: Deep dive into the Linux kernel eBPF hook points used by ATRVASA, comparing XDP, TC, and SockOps for zero-copy socket bypassing.
---

# eBPF Hooks & Kernel Bypass

In a Linux-based operating system, network packets traverse multiple subsystem layers before reaching user-space applications. Traditional firewalls and proxies hook into high-level abstractions like `iptables` or user-space sockets, introducing non-trivial processing overhead.

ATRVASA achieves ultra-low latency and fine-grained control by attaching specialized eBPF programs to **three distinct kernel hook points** within the network stack.

## The Linux Network Stack & Hook Placement

Depending on the security requirement (e.g., L3 DDoS mitigation vs. L7 HTTP URI inspection vs. local socket bypass), ATRVASA attaches eBPF bytecode at different depths in the kernel:

```text
[ Incoming Packet from Network Interface (NIC) ]
                       |
                       v
            +--------------------+
            |      XDP Hook      |  <-- Lowest latency (L2/L3 raw driver)
            +--------------------+
                       |
                       v
            +--------------------+
            |    TC (clsact)     |  <-- Ingress/Egress packet buffer (sk_buff)
            +--------------------+
                       |
                       v
            +--------------------+
            |  TCP/IP Stack &    |  <-- Full network routing & assembly
            |   Socket Layer     |
            +--------------------+
                       |
             (SockOps / SK_MSG)     <-- Short-circuit socket-to-socket redirect
                       |
                       v
            [ User-Space Application Socket ]

```


## Comparison Matrix of ATRVASA Hook Points

| Feature / Metric | XDP (eXpress Data Path) | TC (Traffic Control) | SockOps & SK_MSG |
| --- | --- | --- | --- |
| **Kernel Layer** | Network Driver (Pre-skb) | Network Layer (`sk_buff`) | Socket / Transport Layer |
| **Latency Impact** | Lowest (< 1μs) | Very Low (~ 5-10μs) | Zero-Copy (Bypasses Stack) |
| **Direction** | Ingress Only | Ingress & Egress | Bidirectional Socket Stream |
| **Payload Access** | Raw Packet Bytes | Structured `sk_buff` | Socket Buffer Streams (`sk_msg`) |
| **ATRVASA Purpose** | L3/L4 Fast Drop & DoS | L7 DPI & Shadow API Sensing | Microservice Local Acceleration |


## 1. XDP (eXpress Data Path)

**XDP** allows eBPF code to execute directly inside the Network Interface Card (NIC) driver context before the kernel allocates an `sk_buff` (socket buffer) memory structure.

* **Primary Function in ATRVASA:** Fast L3/L4 IP blocklisting and volumetric threat mitigation.
* **Verdict Actions:**
* `XDP_DROP`: Instantly discards unauthorized packets without allocating kernel memory.
* `XDP_PASS`: Allows valid packets to proceed up to the Traffic Control (TC) layer.


## 2. TC (Traffic Control - `clsact` qdisc)

While XDP is fast, it only operates on incoming traffic (Ingress) and works on raw packet memory. To inspect out-bound (Egress) traffic and extract HTTP/gRPC headers for the **API Shadow Detector**, ATRVASA attaches eBPF programs to the Traffic Control ingress and egress queues (`clsact`).

* **Primary Function in ATRVASA:** Deep Packet Inspection (DPI), HTTP Method/URI parsing, and ring-buffer telemetry logging.
* **Key Advantage:** Operates on `sk_buff`, providing stable helper functions (`bpf_skb_load_bytes`) to safely parse variable-length protocol headers without triggering the kernel verifier bounds errors.


## 3. SockOps & SK_MSG (Socket Bypassing)

For local microservice-to-microservice traffic running on the same Kubernetes node or host, traversing the full TCP/IP routing stack is unnecessary. ATRVASA uses a dual-program socket bypass system:

### Step 1: Connection Capture (`BPF_PROG_TYPE_SOCK_OPS`)

1. The `sock_ops` program intercepts active TCP connection events (`BPF_SOCK_OPS_ACTIVE_ESTABLISHED_CB` and `BPF_SOCK_OPS_PASSIVE_ESTABLISHED_CB`).
2. It extracts socket tuple metadata (Source IP, Destination IP, Source Port, Destination Port).
3. It inserts the socket file descriptor into a key-value eBPF map known as `BPF_MAP_TYPE_SOCKHASH`.

### Step 2: Stream Redirection (`BPF_PROG_TYPE_SK_MSG`)

1. When an application calls `sendmsg()`, the attached `sk_msg` eBPF program intercepts the write buffer.
2. It performs a lookup in the `SOCKHASH` map using the packet's destination tuple.
3. If a matching destination socket is found locally, the message is directly redirected to the target socket's receive queue using `bpf_msg_redirect_hash()`.

```text
[ App A (Client) ]                                      [ App B (Server) ]
  sendmsg()                                              recvmsg()
      |                                                      ^
      v                                                      |
[ Sock A Buffer ] ----> (eBPF sk_msg Redirect) ----> [ Sock B Buffer ]
                           (Bypasses TCP/IP)

```

**Result:** Packets bypass IP routing, iptables chains, netfilter, and ARP lookups, resulting in socket-to-socket memory copy performance.