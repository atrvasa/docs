---
title: Embedded OPA Engine
description: Discover how ATRVASA embeds a native Rust Open Policy Agent (OPA) engine to compile declarative rules directly into eBPF memory maps.
---

# Embedded Zero-Trust OPA Engine

Enforcing Zero-Trust requires evaluating complex, context-aware rules for every network request. Traditionally, this is achieved by running the **Open Policy Agent (OPA)** as a sidecar container. The proxy (e.g., Envoy) pauses the packet, makes a gRPC/HTTP call to the OPA sidecar, waits for the evaluation, and then resumes routing.

This network hop introduces latency. ATRVASA eliminates this bottleneck by integrating a **Lightweight, Rust-native OPA Engine** directly into its control plane, compiling policies down to the kernel level.

## 1. The Embedded Advantage

Instead of running OPA as a separate process, ATRVASA embeds the policy evaluation logic directly within the user-space Rust daemon. 

* **No Network Overhead:** Policy evaluation does not require inter-process communication (IPC) or localhost TCP calls.
* **Memory Safety:** Implemented in pure Rust, the engine is immune to the memory corruption vulnerabilities that can plague C/C++ based proxies.
* **Declarative Configuration:** Operators can define policies using familiar YAML syntax or standard Rego expressions.

## 2. From High-Level Policy to eBPF Bytecode

The true innovation of the ATRVASA OPA Engine is its role as a **Compiler**. The kernel-space eBPF programs do not understand YAML or Rego; they only understand binary data and memory addresses.

When you apply a policy (e.g., `atrvasa policy apply -f rule.yaml`), the embedded engine performs the following compilation pipeline:

### Step 1: Parsing & Identity Resolution
The engine reads the declarative intent. If a rule specifies a Kubernetes service account or a SPIFFE ID (`spiffe://cluster.local/ns/backend/sa/api`), the engine queries the local identity provider to resolve this high-level identity into its current ephemeral IP addresses and active socket descriptors.

### Step 2: Policy Translation
The resolved rules are translated into highly optimized binary data structures.
* IP subnets are converted into **LPM (Longest Prefix Match) Tries**.
* Port and L7 Protocol rules are hashed and packed into **eBPF Hash Maps**.

### Step 3: Atomic Map Injection
Using the `bpf()` syscall via the `Aya` framework, the Rust daemon atomically updates the eBPF maps pinned in the kernel's virtual filesystem (`/sys/fs/bpf`). 

```yaml
# Example: High-Level YAML Policy
apiVersion: atrvasa.dev/v1
kind: ZeroTrustPolicy
metadata:
  name: restrict-db-access
spec:
  target:
    spiffe_id: "spiffe://db-tier"
  rules:
    - action: PASS
      source: "spiffe://backend-api"
      l4_match:
        port: 5432

```

*When compiled, the eBPF data-plane evaluates this rule in `O(1)` time without ever consulting user-space.*


## 3. Asynchronous Fallback (User-Space Evaluation)

While 99% of network rules (L3/L4 routing, basic HTTP method/path filtering) can be compiled into eBPF maps for zero-overhead enforcement, some Zero-Trust requirements are too complex for the kernel's restricted environment.

Examples include:

* Validating deeply nested JWT (JSON Web Token) claims.
* Querying an external Identity Provider (IdP) for real-time revocation status.

In these edge cases, the eBPF program places the packet into a temporary hold state and sends an event to the user-space Rust daemon via a Ring Buffer. The embedded OPA engine performs the complex evaluation asynchronously and returns a verdict to the kernel, which then either drops or forwards the packet.

This hybrid approach ensures that ATRVASA maintains blistering speeds for standard traffic while retaining the flexibility of full OPA semantics.
