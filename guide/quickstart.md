---
title: Quickstart Guide
description: Get ATRVASA up and running in under 5 minutes. Compile the eBPF data-plane, start the daemon, and apply your first Zero-Trust policy.
---

# Quickstart Guide

This guide will walk you through compiling ATRVASA from source, starting the user-space control daemon, and deploying a basic Zero-Trust firewall policy to observe the eBPF kernel enforcement in action.

Ensure you have met the [Prerequisites](./prerequisites) (Linux Kernel >= 5.8, Rust Nightly toolchain, and LLVM) before proceeding.
 
## 1. Clone the Repository

Begin by cloning the ATRVASA repository and navigating to the project root:

```bash
git clone [https://github.com/atrvasa/atrvasa.git](https://github.com/atrvasa/atrvasa.git)
cd atrvasa

```

## 2. Compile the Ecosystem (eBPF & Rust)

ATRVASA uses a cargo `xtask` workflow to seamlessly compile the eBPF C/Rust bytecode for the kernel-space, followed by the user-space Rust daemon.

```bash
# 1. Compile the eBPF programs (requires nightly rust and bpf-linker)
cargo xtask build-ebpf --release

# 2. Compile the user-space control plane and CLI
cargo build --release

```

*The compiled binary will be available at `target/release/atrvasa`.*
 

## 3. Start the ATRVASA Daemon

The daemon handles the lifecycle of the eBPF programs, loads them into the kernel hooks (TC/XDP/SockOps), and initializes the eBPF Maps. It requires elevated privileges.

```bash
# Start the daemon in the background with informational logging
sudo RUST_LOG=info target/release/atrvasa daemon start --detach

```

Verify that the daemon is running and has successfully attached to the network interfaces:

```bash
sudo target/release/atrvasa daemon status

# Expected Output:
# [OK] Daemon running (PID: 12450)
# [OK] eBPF TC Ingress/Egress hooks attached to eth0
# [OK] RingBuffer allocated for Shadow API Detection

``` 

## 4. Apply Your First Zero-Trust Policy

By default, ATRVASA operates in a **Zero-Trust** mode. Let's create a simple Rego/YAML policy that drops all HTTP traffic targeting a specific sensitive endpoint, while allowing others.

Create a file named `policy.yaml`:

```yaml
# policy.yaml
apiVersion: atrvasa.dev/v1
kind: ZeroTrustPolicy
metadata:
  name: restrict-legacy-api
spec:
  target:
    protocol: tcp
    port: 8080
  rules:
    - action: DROP
      l7_match:
        method: POST
        path: "/api/v1/legacy-admin"
    - action: PASS
      default: true

```

Load the policy into the embedded OPA engine, which compiles it into the eBPF Kernel Maps:

```bash
sudo target/release/atrvasa policy apply -f policy.yaml

```
 

## 5. Observe Shadow API Detection

While the firewall enforces the rules, the passive Shadow API detector continuously sniffs the L7 payload using eBPF Ring Buffers.

Open a new terminal and tail the monitoring events:

```bash
sudo target/release/atrvasa shadow monitor

```

Now, simulate some traffic using `curl` to your local environment:

```bash
# 1. Allowed Traffic (Will pass silently)
curl -X GET http://localhost:8080/api/v2/health

# 2. Blocked Traffic (Will be dropped in kernel < 50μs)
curl -X POST http://localhost:8080/api/v1/legacy-admin

# 3. Shadow API (Unmapped endpoint accessed)
curl -X POST http://localhost:8080/api/v1/hidden-test

```

In your `shadow monitor` terminal, you should instantly see the telemetry output indicating kernel-level rejections and discovered zombie APIs:

```text
[FIREWALL] DROP: POST /api/v1/legacy-admin (Rule: restrict-legacy-api) - Latency: 12μs
[SHADOW_API] ALERT: Unmapped endpoint accessed: POST /api/v1/hidden-test

```
 

## Next Steps

Congratulations! You have successfully deployed the ATRVASA ecosystem.

* To understand how packets bypass the TCP/IP stack entirely, read about our [Sidecarless Architecture](https://www.google.com/search?q=./concepts/sidecarless).
* To explore the low-level kernel hooks, check out the [Architecture Overview](https://www.google.com/search?q=/architecture/overview).
 