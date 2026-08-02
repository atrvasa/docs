---
title: Rust Control Plane
description: Deep dive into the ATRVASA user-space daemon, exploring the Aya framework, asynchronous event handling with Tokio, and map synchronization.
---

# Rust Control Plane

While the eBPF Data Plane handles the high-speed packet processing in the kernel, it is intentionally kept "dumb" and stateless regarding high-level business logic. The intelligence of the ATRVASA ecosystem resides in the **Rust Control Plane** (the user-space daemon).

Built entirely in memory-safe Rust, the control plane is responsible for orchestrating the eBPF lifecycle, compiling Zero-Trust policies, and processing real-time telemetry asynchronously.

## 1. The Aya Framework

Traditional eBPF development relies heavily on the `libbpf` C library and `clang` wrappers. ATRVASA departs from this legacy approach by utilizing the **[Aya Framework](https://aya-rs.dev/)**.

Aya allows ATRVASA to be a pure Rust project. It handles the loading, relocating (via CO-RE), and attaching of eBPF bytecodes directly using native Rust syscalls. This eliminates the need for heavy C toolchains on the deployment nodes and guarantees memory safety across the entire user-space application.

```rust
// Architecture Example: Loading an eBPF program natively with Aya
let mut bpf = Bpf::load(include_bytes_aligned!(
    "../../target/bpfel-unknown-none/release/atrvasa-firewall"
))?;

// Load and attach the Traffic Control (TC) program
let program: &mut SchedClassifier = bpf.program_mut("tc_ingress").unwrap().try_into()?;
program.load()?;
program.attach("eth0", TcAttachType::Ingress)?;

```

## 2. Asynchronous Event Architecture (Tokio)

The **API Shadow Detector** relies on a massive stream of L7 metadata coming from the kernel's Ring Buffer. Processing this synchronously would severely bottleneck the control plane.

ATRVASA leverages the **Tokio** async runtime. A dedicated green thread continuously polls the eBPF Ring Buffer without blocking the main policy enforcement loop or the CLI gRPC server.

```rust
// Architecture Example: Async RingBuffer polling
let mut ring_buf = RingBuf::try_from(bpf.take_map("TELEMETRY_EVENTS").unwrap())?;

tokio::spawn(async move {
    loop {
        // Asynchronously wait for new telemetry data from the kernel
        let events = ring_buf.read_events().await.unwrap();
        for event in events {
            process_shadow_api_event(event); // Reconstruct OpenAPI schema
        }
    }
});

```

## 3. Policy Compilation & Map Synchronization

When a cluster administrator applies a new Zero-Trust rule via the CLI, the daemon's **Embedded OPA Engine** parses the YAML/Rego declarative intent and translates it into raw binary byte arrays.

These bytes are injected into the kernel's eBPF Maps. ATRVASA utilizes two primary map topologies for policy state:

1. **`HashMap`**: Used for `O(1)` constant-time lookups of exact matches (e.g., mapping specific SPIFFE IDs to active Socket Descriptors).
2. **`LpmTrie` (Longest Prefix Match)**: Used for evaluating CIDR blocks and L3 routing rules efficiently.

### Atomic Updates

To ensure that the firewall never evaluates packets against a partially updated rule set, the control plane performs atomic map updates. The kernel data-plane instantly enforces the new verdict the moment the Rust daemon completes the `bpf_map_update_elem` syscall.


## 4. Lifecycle & Graceful Shutdown

The Rust daemon manages the complete lifecycle of the security mesh:

1. **Kernel Probing:** Probes the host kernel for BTF (BPF Type Format) to ensure CO-RE (Compile Once - Run Everywhere) relocations will succeed.
2. **Map Pinning:** Pins the eBPF maps to the `/sys/fs/bpf/atrvasa` virtual filesystem. If the user-space daemon crashes, the kernel maps persist, and the firewall continues to enforce the last known good state seamlessly.
3. **Graceful Detachment:** Upon receiving a `SIGTERM` (e.g., during a Kubernetes node drain), the daemon cleanly detaches the `TC`, `XDP`, and `SockOps` hooks, removing its footprint from the network stack.
