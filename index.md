---
layout: home

hero:
  name: "ATRVASA"
  text: "Zero-overhead eBPF Observability"
  tagline: "The Guardian of Fire. Blazing-fast network monitoring, Zero-Trust firewall, and Shadow API detection for Linux."
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Read the Blog (Rust & eBPF)
      link: /blog/

features:
  - title: Zero-Copy Architecture
    details: No packets are sent to user-space. Data stays securely in the kernel via XDP/TC.
  - title: Zero-Trust Firewall
    details: Drop or allow packets with L4/L7 visibility and basic mTLS extraction under 50μs.
  - title: Shadow API Detection
    details: Passively sniff REST/gRPC traffic and compare live data against OpenAPI specs.
---