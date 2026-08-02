---
layout: home

hero:
  name: "ATRVASA"
  text: "eBPF-Powered Zero-Trust Security"
  tagline: "The Guardian of Fire. Blazing-fast Linux kernel-level firewall, passive API shadow detector, and embedded Rust OPA engine."
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: Architecture Deep Dive
      link: /architecture/overview
    - theme: alt
      text: View on GitHub
      link: https://github.com/atrvasa/atrvasa

features:
  - title: Kernel Socket Bypass
    details: Bypasses TCP/IP stack overhead using eBPF sockmap & sk_msg. Direct socket-to-socket zero-copy streaming for local workloads.
  - title: Zero-Trust Policy Engine
    details: Embedded Rust-native OPA evaluator compiling declarative Rego/YAML rules directly into high-performance eBPF LPM/Hash Maps.
  - title: Passive API Shadow Detector
    details: Non-intrusive L7 traffic inspection via eBPF ring buffers. Automatically infers OpenAPI schemas and flags unmapped zombie/shadow endpoints.
  - title: Memory Safe & High-Performance
    details: Built entirely in Rust and eBPF bytecode. Eliminates memory corruption risks in both user-space control-plane and kernel data-plane.
---

<news-letter />