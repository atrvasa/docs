---
title: CLI Reference
description: Command-line interface documentation for the ATRVASA control plane, policy management, and shadow API detection.
---

# CLI Reference

The `atrvasa` command-line tool is the primary interface for managing the ATRVASA ecosystem. It allows you to start the user-space daemon, apply Zero-Trust policies, inspect eBPF maps, and interact with the Shadow API detector.

Since ATRVASA interacts directly with the Linux kernel via eBPF, most commands require elevated privileges (`root` or `CAP_BPF` and `CAP_NET_ADMIN` capabilities).

---

## Global Flags

These flags can be applied to any `atrvasa` command:

| Flag | Description | Default |
| :--- | :--- | :--- |
| `-c, --config <FILE>` | Path to the main configuration file | `/etc/atrvasa/config.toml` |
| `--log-level <LEVEL>` | Set the logging verbosity (`trace`, `debug`, `info`, `warn`, `error`) | `info` |
| `--bpf-fs <PATH>` | Custom path for the eBPF virtual filesystem (for map pinning) | `/sys/fs/bpf/atrvasa` |

---

## Daemon Management

The daemon is the long-running Rust process that loads the eBPF bytecodes into the kernel and maintains the map synchronization.

### `atrvasa daemon start`

Starts the control-plane daemon. This command compiles the initial OPA policies and loads the `TC`, `SockOps`, and `RingBuffer` eBPF programs into the kernel.

```bash
# Start the daemon in the foreground with debug logging
sudo atrvasa daemon start --log-level debug

```

**Options:**

* `--detach, -d`: Run the daemon in the background.
* `--dry-run`: Verify eBPF compatibility on the host kernel without actually attaching the hooks.

---

## Policy Management

These commands interface with the embedded OPA engine to translate declarative rules into eBPF Map data.

### `atrvasa policy apply`

Parses a Zero-Trust YAML/Rego policy file, compiles it into binary state, and atomically updates the eBPF Policy Hash Maps.

```bash
# Apply a specific microservice access policy
sudo atrvasa policy apply -f ./policies/payment-service.yaml

```

### `atrvasa policy list`

Displays all currently active policies enforced by the kernel.

```bash
sudo atrvasa policy list

# Output Example:
# ID          TARGET          ACTION    TYPE      LOADED_AT
# pol_8a1b    spiffe://web    PASS      L4/L7     2024-05-12T10:00:00Z
# pol_9x2c    spiffe://db     DROP      L4        2024-05-12T10:05:00Z

```

---

## Shadow API Detection

Commands for interacting with the passive L7 telemetry ring buffer.

### `atrvasa shadow monitor`

Tails the eBPF Ring Buffer to display real-time API schema inferences and unauthorized endpoint accesses.

```bash
sudo atrvasa shadow monitor

# Output Example:
# [WARN] Unmapped API detected: POST /api/v2/legacy-auth (Pod: auth-service-v1)
# [INFO] Inferred Schema Update: GET /api/v1/users (Headers: Authorization, X-Request-ID)

```

### `atrvasa shadow export`

Exports the aggregated API paths and inferred schemas into a standard OpenAPI (Swagger) v3 format.

```bash
# Export the discovered internal APIs to a JSON file
atrvasa shadow export --format openapi-json -o ./shadow-openapi.json

```

**Options:**

* `--format <json|yaml>`: The output format for the schema.
* `--namespace <NS>`: Filter the export to a specific Kubernetes namespace or cgroup.

---

## Map Inspection (Advanced Debugging)

For low-level troubleshooting, you can directly query the eBPF maps pinned in the kernel.

### `atrvasa map inspect`

Dumps the current keys and values of a specific eBPF map.

```bash
# Inspect the active socket-bypass map
sudo atrvasa map inspect sock_map

# Output Example:
# KEY (SrcIP:Port -> DstIP:Port)        VALUE (Socket Descriptor)
# 10.0.1.5:45678 -> 10.0.1.10:8080      fd: 14 (State: ESTABLISHED)

```

```bash
# Inspect the L4 IP blocklist map
sudo atrvasa map inspect l4_blocklist

```