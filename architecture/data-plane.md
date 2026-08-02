---
title: eBPF Data Plane
description: Technical deep dive into the ATRVASA kernel-space data plane, covering packet parsing, bounds checking, and eBPF map interactions.
---

# eBPF Data Plane Architecture

The Data Plane in ATRVASA is entirely decoupled from user-space. It resides within the Linux kernel, executing highly optimized eBPF bytecode compiled from Rust (using Aya) or standard C. Its primary responsibilities are packet interception, deep packet inspection (DPI), policy evaluation, and event telemetry.

Because this code runs directly in the kernel, it must adhere to the strict safety rules enforced by the **eBPF Verifier**.

## 1. The Execution Context & The Verifier

Unlike standard user-space applications, the ATRVASA data plane cannot use standard libraries (`std`), allocate memory dynamically (`malloc` / `Box`), or utilize unbounded loops. 

Every eBPF program loaded by ATRVASA is statically analyzed by the kernel verifier before execution to ensure it cannot crash or halt the OS.

### Safe Packet Parsing (Bounds Checking)
When the firewall intercepts a packet at the XDP or TC hook, it receives two pointers: `data` (the start of the packet) and `data_end` (the end of the packet). 
To parse network headers without triggering a verifier rejection, ATRVASA implements strict bounds checking.

```rust
// Example: Safe Rust eBPF packet parsing (Aya Framework style)
#[inline(always)]
pub fn parse_ipv4(ctx: &XdpContext) -> Result<Ipv4Hdr, ()> {
    let data = ctx.data();
    let data_end = ctx.data_end();

    let eth_hdr_size = core::mem::size_of::<EthHdr>();
    let ipv4_hdr_size = core::mem::size_of::<Ipv4Hdr>();

    // Verifier Check 1: Ensure Ethernet header fits
    if data + eth_hdr_size > data_end {
        return Err(());
    }

    // Verifier Check 2: Ensure IPv4 header fits
    if data + eth_hdr_size + ipv4_hdr_size > data_end {
        return Err(());
    }

    // Safe pointer casting after bounds check
    let ipv4_hdr = unsafe { &*((data + eth_hdr_size) as *const Ipv4Hdr) };
    Ok(*ipv4_hdr)
}

```

*Note: Without these explicit `data_end` checks, the Linux kernel will refuse to load the ATRVASA firewall.*

## 2. Policy Enforcement Workflow

Once the packet is safely parsed, the data plane must decide its fate (`XDP_PASS` vs `XDP_DROP`, or `TC_ACT_OK` vs `TC_ACT_SHOT`).

1. **Tuple Extraction:** The program extracts the 4-tuple (Source IP, Dest IP, Source Port, Dst Port) and the protocol.
2. **Map Lookup:** It performs a lookup in the pinned eBPF Policy Maps.

```c
/* Example: C-eBPF Policy Lookup */
struct packet_tuple key = {
    .src_ip = ipv4->saddr,
    .dst_ip = ipv4->daddr,
    .dst_port = tcp->dest
};

// O(1) Hash Map Lookup
struct policy_verdict *verdict = bpf_map_lookup_elem(&policy_map, &key);

if (!verdict) {
    return XDP_DROP; /* Zero-Trust Default Deny */
}

return verdict->action == ACTION_PASS ? XDP_PASS : XDP_DROP;

```

## 3. Telemetry & The Ring Buffer

For the **API Shadow Detector**, the data plane must extract L7 metadata (HTTP paths, methods) and send it to user-space.

Using legacy `bpf_perf_event_output` can lead to memory overhead and dropped events under high load. ATRVASA exclusively uses the modern `BPF_MAP_TYPE_RINGBUF`.

### The Ring Buffer Advantage

1. **Memory Reservation:** The eBPF program reserves a chunk of memory directly in the ring buffer before copying data.
2. **Lockless Architecture:** It allows multiple CPUs to concurrently push L7 metadata structs without locking contentions.
3. **Commit/Discard:** If the metadata is successfully parsed, it commits the data; if a parsing error occurs mid-way, it safely discards the reservation, preventing partial data corruption in user-space.

```rust
// Telemetry Struct Shared between Kernel and User-space
#[repr(C)]
pub struct L7TelemetryEvent {
    pub src_ip: u32,
    pub method: [u8; 8],
    pub uri: [u8; 64],
}

// Emitting data to the Ring Buffer inside the TC hook
if let Some(mut event) = RING_BUF.reserve::<L7TelemetryEvent>(0) {
    event.src_ip = ipv4_hdr.src_addr;
    copy_http_method(&mut event.method, payload);
    event.submit(0); // Pushed to Rust User-Space
}

```

## 4. Socket Bypassing (`sk_msg`)

The most advanced segment of the ATRVASA data plane is the socket-level redirection.

When two microservices on the same node communicate, the `sock_ops` hook stores their socket descriptors in a `BPF_MAP_TYPE_SOCKHASH`.
The `sk_msg` program then triggers every time an application calls `send()`. It intercepts the raw bytes and uses `bpf_msg_redirect_hash()` to push the payload directly into the receiving microservice's buffer queue.

By doing this at the transport layer (L4), ATRVASA completely bypasses the lower IP routing, Netfilter, and Qdisc layers, achieving near zero-copy performance for the service mesh.
 