---
title: Introduction
description: Technical overview of ATRVASA - An eBPF-powered, Rust-native Zero-Trust Security Ecosystem.
---

# Introduction to ATRVASA

**ATRVASA** is a high-performance, open-source Zero-Trust security ecosystem implemented in **Rust** and powered by **eBPF (Extended Berkeley Packet Filter)**. Designed for modern microservice architectures and cloud-native environments, ATRVASA addresses the performance overhead and security blind spots of traditional sidecar-based service meshes by shifting policy enforcement, API discovery, and identity verification directly into the Linux kernel.

Rather than operating as isolated security utilities, ATRVASA is engineered as a unified **Case Study Framework** where three core components interoperate in real time:

1. **eBPF-based Zero-Trust Service Mesh Firewall** (Kernel-level L4/L7 Traffic Control)
2. **API Shadow Detector** (Passive eBPF-based Traffic Inspection & Schema Inference)
3. **Embedded Lightweight OPA Engine** (Rust-native Policy Decision Point compatible with Zero-Trust semantics)


## The Problem: The Sidecar & Perimeter Security Bottleneck

Traditional Zero-Trust architectures rely heavily on proxy sidecars (e.g., Envoy) injected alongside each microservice container. While flexible, this approach introduces significant architectural friction:

* **Latency Amplification:** Every intra-cluster network call traverses the TCP/IP stack multiple times (Application → Loopback → Sidecar Proxy → Kernel → NIC → NIC → Kernel → Sidecar Proxy → Loopback → Application).
* **High Resource Footprint:** Running dedicated user-space proxy instances per pod drains memory and CPU across large-scale clusters.
* **Shadow API Blind Spots:** Traditional firewalls and ingress gateways miss unauthorized microservice endpoints exposed internally without explicit proxy routing.


```
Traditional Sidecar Approach:
[Pod A App] ---> [Proxy Sidecar] ---> (Network) ---> [Proxy Sidecar] ---> [Pod B App]
(User-space)     (User-space)                       (User-space)     (User-space)

ATRVASA eBPF Approach:
[Pod A App] ==================== (Kernel eBPF Maps/TC Hook) ===================> [Pod B App]
Zero-Copy / Direct Socket Short-Circuit

```


## Core System Architecture

ATRVASA shifts data-plane operations from user-space down to the Linux kernel via eBPF program types (`BPF_PROG_TYPE_SCHED_ACT`, `BPF_PROG_TYPE_SOCK_OPS`, and `BPF_PROG_TYPE_SK_SKB`). The Rust user-space control-plane orchestrates eBPF lifecycle events, manages map state synchronization, and executes complex policy compilation.


```

+-------------------------------------------------------------------------+
|                            USER SPACE (Rust)                            |
|                                                                         |
|  +-----------------------+  +--------------------+  +----------------+  |
|  |  Zero-Trust OPA Engine |  | Shadow API Engine  |  | ATRVASA CLI    | |
|  |  (Policy Compiler/PDP) |  | (Schema Inference) |  | & Daemon (PEP) | |
|  +-----------+-----------+  +---------^----------+  +-------+--------+  |
+--------------|------------------------|---------------------|-----------+
               | Sync Rules             | Read Events         | Update Maps
               v                        | (RingBuffer)        v
+--------------+------------------------+---------------------+-----------+
|                           KERNEL SPACE (eBPF)                           |
|                                                                         |
|  +--------------------+   +---------------------+   +----------------+  |
|  |  eBPF SockOps Map  |   | eBPF Ring Buffer    |   | Policy Maps    |  |
|  |  (Socket Bypassing)|   | (Telemetry Payload) |   | (L4/L7 ACLs)   |  |
|  +---------+----------+   +----------^----------+   +-------+--------+  |
|            |                         |                      |           |
|            v                         |                      v           |
|     [SK_SKB Redirect]        [TC / XDP Hook]         [Packet Verdict]   |
+-------------------------------------------------------------------------+

```


## Component Deep Dive

### 1. eBPF Zero-Trust Service Mesh Firewall (`atrvasa-firewall`)

Written in pure Rust using **Aaya** / **libbpf-rs**, `atrvasa-firewall` enforces identity-aware network policies at the kernel boundary:

* **Socket-level Bypassing:** Utilizes `sock_map` and `sk_msg` programs to short-circuit TCP communication between local processes/containers, eliminating the overhead of the TCP/IP stack entirely.
* **L4/L7 Policy Enforcement:** Hooks into Traffic Control (TC) ingress/egress layers to perform stateful packet filtering, SPIFFE identity validation, and HTTP/mTLS payload parsing.
* **Zero-Copy Performance:** Evaluates network rules directly within the packet buffer without copying data to user-space.

### 2. API Shadow Detector (`atrvasa-shadow-detector`)

Undocumented (shadow) or deprecated (zombie) APIs pose critical security risks in dynamic microservice environments. `atrvasa-shadow-detector` works passively alongside the firewall:

* **Non-Intrusive Inspection:** Taps into network traffic using eBPF socket filters and ring buffers without altering or delaying packet flow.
* **Real-time Schema Inference:** Extracts request URIs, HTTP methods, headers, and payload structures in real time, pushing event streams to user-space.
* **Automated OpenAPI Generation:** Aggregates observed traffic patterns to construct dynamic OpenAPI (Swagger) specifications and alert operators when unmapped endpoints are accessed.

### 3. Embedded Zero-Trust OPA Engine (`atrvasa-opa`)

A lightweight, high-performance policy evaluation engine tailored for low-latency security checks:

* **Native Rust Implementation:** Evaluates Zero-Trust access rules defined in Rego or simplified YAML formats with minimal memory allocation.
* **Kernel-Map Synchronization:** Compiles high-level access policies into efficient binary lookups (LPM Tries, Hash Maps) and loads them directly into eBPF maps for sub-microsecond kernel-space decisions.
* **Fallback & Complex Rules:** Handles high-level contextual evaluations in user-space when policies require identity provider (IdP) integration or asynchronous token verifications.


## Key Design Principles

1. **Security by Default (Zero-Trust):** Mutual identity verification and strict least-privilege access rules apply to every network connection across workloads.
2. **Zero-Overhead Philosophy:** Sub-millisecond latency impact on microservice communication by executing packet processing inside the kernel context.
3. **Rust Memory Safety:** Complete elimination of memory safety vulnerabilities (e.g., buffer overflows, use-after-free) in both user-space binaries and eBPF kernel bytecode verification pipelines.
4. **Declarative Configuration:** Unified YAML-based configuration for network policies, API discovery rules, and access control specs.


## Getting Started

To explore ATRVASA documentation and deploy the case study setup:

* Read the [Architecture Overview](/architecture/overview) to understand the kernel-to-user-space interaction model.
* Follow the [Quickstart Guide](/guide/quickstart) to deploy ATRVASA on a local KinD (Kubernetes-in-Docker) cluster.
* Review the [CLI Reference](/usage/cli-reference) for command-line operation and policy deployment.

 