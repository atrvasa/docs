---
title: eBPF Firewall Engine
description: Deep dive into the ATRVASA Zero-Trust Firewall, exploring L4/L7 packet filtering and map-driven O(1) policy enforcement.
---

# eBPF Zero-Trust Firewall Engine

The **ATRVASA Firewall Engine** is the primary enforcement point of the ecosystem. It replaces traditional `iptables` or `netfilter` chains with highly optimized eBPF bytecodes attached directly to the network interfaces and socket layers.

Operating entirely in the Linux kernel space, it enforces the "Default Deny" posture required by Zero-Trust architectures with sub-millisecond latency.


## 1. The Default Deny Posture

In a traditional perimeter-based network, traffic inside a private subnet is often trusted by default. ATRVASA reverses this assumption. 

When the firewall is attached to a network interface (e.g., `eth0` or `veth` pairs in Kubernetes), the default action for any packet that does not explicitly match an allowed rule in the policy map is `BPF_DROP` (or `XDP_DROP`). This ensures that lateral movement by an attacker or a compromised microservice is mathematically impossible at the lowest level of the OS.

## 2. Multi-Layer Enforcement

To balance performance with deep packet inspection capabilities, the firewall operates across multiple network layers simultaneously.

### L3/L4 Fast Path (XDP & TC)
For basic IP and Port-level restrictions, ATRVASA evaluates rules early in the packet lifecycle.
* **IP Subnets:** Evaluated using `BPF_MAP_TYPE_LPM_TRIE` (Longest Prefix Match). This allows O(1) lookups for CIDR blocks.
* **TCP/UDP Ports:** Evaluated using standard `BPF_MAP_TYPE_HASH`.
* **Action:** Unauthorized connection attempts (e.g., an unauthorized SYN packet) are dropped instantly, mitigating volumetric attacks (DoS) without consuming CPU cycles for connection tracking.

### L7 Deep Packet Inspection (TC Ingress/Egress)
Zero-Trust requires more than just IP/Port filtering; it requires application-level context. The firewall includes a specialized eBPF parser that safely walks the packet payload.
* **HTTP/gRPC Parsing:** Extracts HTTP Methods (`GET`, `POST`) and Host/URI paths directly from the `sk_buff` bytes.
* **Policy Matching:** An HTTP POST to `/api/v1/admin` might be dropped, while a GET to `/api/v1/health` from the same source IP is allowed.
* **mTLS/Identity Context:** While eBPF does not decrypt TLS payloads, it can parse unencrypted TLS handshake headers (e.g., SNI) to verify that the expected cryptographic identity is initiating the connection.

## 3. Map-Driven Architecture

The firewall logic inside the kernel is static; it does not change when you apply a new YAML policy. Instead, the logic is **data-driven**.

1. The Rust Control Plane (User-Space) compiles your high-level policies.
2. It updates specific eBPF Maps (Key-Value stores residing in kernel memory).
3. The eBPF Firewall program continuously reads from these maps to make decisions.

```text
// Simplified eBPF Kernel Logic Example (C-pseudo code)
struct packet_tuple key = extract_tuple(skb);
struct policy_rule *rule = bpf_map_lookup_elem(&policy_map, &key);

if (!rule) {
    return TC_ACT_SHOT; // Default Deny
}

if (rule->action == ACTION_PASS) {
    return TC_ACT_OK;
}

```

This strict separation ensures that the kernel program never blocks waiting for user-space, maintaining deterministic and ultra-low latency for every packet.

## Next in the Ecosystem

While the firewall aggressively drops unauthorized traffic, it needs a way to discover what APIs actually exist and alert you to unexpected behavior. This is handled by the **API Shadow Detector**.

 