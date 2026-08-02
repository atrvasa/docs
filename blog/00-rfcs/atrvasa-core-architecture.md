---
title: "Why the Future of Zero-Trust is in the Kernel Layer (Publishing ATRVASA's First RFC)"
description: "Discover how ATRVASA uses Rust and eBPF (XDP/TC) to eliminate user-space bottlenecks and build a zero-overhead, zero-trust firewall. Read our first architectural RFC."
date: 2026-08-02
author: Amin Nouri
lang: en-US
tags:
  - Rust
  - eBPF
  - Zero-Copy
  - Memory-Safety
  - ATRVASA
head:
  - [meta, { name: "keywords", content: "eBPF, Rust, Zero-Trust, Zero-Copy, XDP, TC, Firewall, Shadow API Detection, Network Observability" }]
  - [meta, { property: "og:title", content: "Why the Future of Zero-Trust is in the Kernel Layer (ATRVASA RFC)" }]
  - [meta, { property: "og:description", content: "Discover how ATRVASA uses Rust and eBPF to eliminate user-space bottlenecks and build a zero-overhead, zero-trust firewall." }]
  - [meta, { property: "og:type", content: "article" }]
  - [meta, { property: "og:url", content: "https://atrvasa.com/blog/00-rfcs/atrvasa-core-architecture" }]
  - [meta, { name: "twitter:card", content: "summary_large_image" }]
---

# Why the Future of Zero-Trust is in the Kernel Layer (Publishing ATRVASA's First RFC)

If you have experience monitoring or enforcing security policies in high-throughput networks (like 10G or 40G), you are probably familiar with a common architectural challenge: processing packets in user-space is a highly expensive bottleneck.

In modern cloud infrastructure, we require precise visibility at the Network Interface Card (NIC) layer for troubleshooting and security. However, traditional tools achieve this by copying packets from kernel-space to user-space. This continuous data transfer requires repetitive memory copies and constant context switching, ultimately leading to severe CPU resource waste and increased network latency. Organizations typically resort to over-provisioning and adding more servers, but this merely masks the problem.

In the open-source **ATRVASA** project, we decided to solve this structural issue at its root. Today, we published the first architectural RFC for this project, and in this post, I want to share the story behind this platform and how it works.

## Why Weren't Existing Tools Enough?

Before starting development, we evaluated existing tools. None provided the exact combination of security, high precision, and near-zero overhead required for 24/7 production environments:

* **libpcap-based tools (like tcpdump):** Excellent for deep packet analysis, but copying every packet to user-space under high traffic loads heavily taxes the CPU.
* **Metric exporters (like Prometheus Node Exporter):** Provide high-level metrics but lack dynamic traffic decomposition and micro-burst latency tracking capabilities.
* **Heavy eBPF-based CNIs (like Cilium):** Incredibly powerful, but often tightly coupled with large Kubernetes ecosystems, bringing their own infrastructure overhead. We needed a much simpler tool, independent of heavy cloud-native dependencies, with a specific focus on Shadow API detection.
* **Loadable Kernel Modules (LKMs):** Extremely fast, but carry high stability risks. A tiny memory management bug can lead to a fatal Kernel Panic.

## The ATRVASA Approach: Zero-Copy Processing with eBPF and Rust

To completely eliminate the user-space bottleneck, we architected ATRVASA entirely around eBPF (specifically targeting the XDP and TC subsystems). This system consists of three main components:

**1. In-Kernel Processing Layer (eBPF Programs):**
Our code attaches directly and safely to the network driver. For L4 firewalling, the XDP hook matches packets against security policies before the kernel even allocates memory (like `sk_buff`), instantly deciding to drop (`XDP_DROP`) or pass (`XDP_PASS`) the traffic. Alongside this, at the TC layer, L7 HTTP headers are passively scanned to identify undocumented endpoints (Shadow APIs).

**2. Shared Memory Structures (eBPF Maps):**
We utilize **Per-CPU Hash Maps** to aggregate metrics (like packet counters) to prevent lock contention across CPU cores. Furthermore, to send asynchronous events—such as security policy violations or Shadow API detection alerts—to user-space, we leverage the highly optimized **Ring Buffer** structure.

**3. User-Space Agent (Rust Agent):**
Built using the Aya framework, this agent is incredibly fast and memory-safe. Importantly, this agent has no direct involvement in raw packet processing. Its sole responsibility is compiling YAML policies (via an embedded OPA engine), writing them into eBPF Maps, and periodically polling logs from the Ring Buffer.

## User Experience (UX) and System Output

All of this complexity is packaged into a single, self-contained static binary. Running it is as simple as executing a terminal command:

```bash
sudo atrvasa-agent --interface eth0 --interval 1s

```

Instead of facing a flood of raw packets, ATRVASA provides an aggregated, real-time dashboard of your network and security status:

```text
[ATRVASA Agent] | Interface: eth0 | Mode: XDP/TC | Uptime: 00:15:32
=============================================================================
SRC IP          DST IP          PORT   PROTO   TX (bps)   RX (bps)   LATENCY
-----------------------------------------------------------------------------
192.168.1.10    10.0.0.5        443    TCP     4.2 M      1.1 M      < 1ms
192.168.1.10    8.8.8.8         53     UDP     12 K       45 K       1.2ms
10.0.0.50       192.168.1.10    80     TCP     0          500 M      < 1ms 
10.0.0.12       192.168.1.10    22     TCP     [ BLOCKED BY OPA POLICY ]
=============================================================================
[ALERT] Shadow API Detected: POST /api/v2/legacy-login from 10.0.0.50
-----------------------------------------------------------------------------
Total TX: 4.21 M/s | Total RX: 501.1 M/s | Dropped Packets: 14 | CPU: 0.1%

```

Because eBPF bytecode is validated by the kernel verifier and converted into native machine code (JIT Compilation) before execution, the CPU overhead remains strictly under 1% in most production workloads.

## Call for Participation: We Need Your Technical Feedback

Before diving deep into the implementation phase code, we have published the platform's architecture as an RFC on GitHub. We want to ensure our design decisions are battle-tested by the community.

Currently, there are a few open questions in the architecture that heavily require the perspectives of systems and network engineers:

1. **Attachment Layer Selection:** For general observability scenarios, what are your thoughts on using XDP (faster, but limited in packet modification) versus TC (slightly higher overhead, but better flexibility for L7 egress traffic inspection)?
2. **Handling Fragmented Packets:** What is the most effective approach for handling IP fragments at the eBPF layer? Is ignoring fragmented packets acceptable for the initial MVP release?
3. **User Interface Priorities:** Is a terminal-based CLI dashboard sufficient for early adoption, or is native Prometheus exporter support a mandatory requirement from day one?

### How to Get Involved

If you are interested in systems programming, Linux kernel, and Zero-Copy architectures, we would love to have your input. Here is how you can review the architecture and share your insights:

* **Read the Full RFC:** Review the complete `0001-atrvasa-core-architecture.md` file directly in our [ATRVASA GitHub Repository](https://github.com/atrvasa/atrvasa/).
* **Join the Discussion:** Share your technical feedback, critique our eBPF map choices, or answer the open questions in our [GitHub Discussions Thread](https://github.com/atrvasa/atrvasa/discussions). 
* **Explore the Platform:** Visit [atrvasa.com](https://atrvasa.com/) for high-level architecture overviews, documentation, and upcoming milestones.

We build in public, and your technical critique at this stage is invaluable.