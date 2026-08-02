---
title: Zero-Trust Model in eBPF
description: How ATRVASA enforces identity-aware, Zero-Trust networking inside the Linux kernel without relying on user-space proxies.
---

# Zero-Trust Model in eBPF

The core philosophy of Zero-Trust is **"Never trust, always verify."** In a microservice environment, this means no network connection is implicitly allowed, even if it originates from within the same Kubernetes namespace or local network. Every single packet must be evaluated against a strict identity and access control policy.

Traditional service meshes achieve this by terminating the connection at a user-space proxy (like Envoy), verifying the mTLS certificate, evaluating the Open Policy Agent (OPA) rules, and then re-originating the connection. ATRVASA shifts this entire paradigm down into the kernel.


## The Identity & Verification Challenge

How do you verify workload identity and enforce complex Zero-Trust policies (e.g., *"Service A can only HTTP POST to Service B on port 8080"*) without a proxy?

ATRVASA solves this through a tightly coupled **Control-Plane (Rust) to Data-Plane (eBPF)** synchronization model.

### 1. Declarative Intent (User-Space)
Administrators define Zero-Trust policies using standard YAML or Rego configurations. The embedded Rust-native OPA engine parses these high-level intents. It understands Kubernetes primitives, SPIFFE IDs, and IP subnets.

### 2. Compilation to Kernel Data Structures
The Rust daemon does not send the YAML file to the kernel. Instead, it compiles these policies into highly optimized binary data structures and injects them into specific **eBPF Maps** using the `bpf()` syscall.

* **LPM Tries (Longest Prefix Match):** Used for fast L3 IP subnet filtering.
* **Hash Maps:** Used for L4/L7 precise lookups (e.g., mapping a destination IP and Port to an allowed HTTP method).

### 3. O(1) Data-Plane Enforcement (Kernel-Space)
When a packet hits the network interface, the eBPF program attached to the `TC` (Traffic Control) or `XDP` (eXpress Data Path) hook intercepts it before it reaches the TCP/IP stack.

1. The eBPF program parses the packet headers (Eth -> IP -> TCP -> HTTP).
2. It extracts the source IP, destination IP, port, and L7 metadata.
3. It performs a lookup against the injected eBPF Policy Maps.
4. It receives an immediate, constant-time `O(1)` verdict: **PASS** or **DROP**.

```text
[ Incoming Packet ]
        |
        v
 +-------------------+      Lookup      +-----------------------+
 | eBPF TC Hook      | ---------------> | eBPF Hash/LPM Maps    |
 | (Packet Parser)   | <--------------- | (Pre-compiled Rules)  |
 +-------------------+      Verdict     +-----------------------+
        |
        +-- (If PASS) --> To Application Socket
        |
        +-- (If DROP) --> Packet discarded silently in kernel (< 50μs)

```


## Identity Context & mTLS

While ATRVASA excels at L3/L4 and unencrypted L7 filtering, full Zero-Trust often requires cryptographic identity verification (mTLS).

In a purely sidecarless eBPF architecture, terminating TLS in the kernel is complex. ATRVASA approaches this by collaborating with modern identity frameworks (like SPIRE) and tracking socket metadata. When a workload requests a connection, the Rust daemon maps the workload's cryptographic identity (cgroup/namespace) to its underlying IP and socket descriptor.

This allows the eBPF data-plane to enforce rules based on cryptographic identity context, without needing to perform the expensive RSA/AES decryption inside the kernel itself.


## Default Deny Posture

By default, the ATRVASA firewall operates in a **Default Deny** posture. If an active socket or incoming packet does not match a specifically allowed rule within the eBPF Hash Maps, the packet is instantly dropped at the lowest possible level of the operating system, protecting your cluster from lateral movement and unauthorized access.