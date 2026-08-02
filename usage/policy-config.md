---
title: Policy Configuration
description: Guide to writing declarative Zero-Trust policies (YAML) for the ATRVASA eBPF firewall and embedded OPA engine.
---

# Policy Configuration

ATRVASA embraces a declarative approach to security. Instead of writing complex `iptables` rules or kernel-specific match conditions, administrators define **Zero-Trust intents** using simple YAML files. 

The embedded Rust OPA engine compiles these intents into binary eBPF Map data, ensuring deterministic, `O(1)` enforcement in the kernel.

## Anatomy of a Policy

Every ATRVASA policy follows a Kubernetes-style Custom Resource Definition (CRD) structure, making it natively familiar to cloud engineers.

A basic policy consists of three main sections:
1. **`metadata`**: Identifies the policy.
2. **`target`**: Defines which local workload(s) this policy protects (the destination).
3. **`rules`**: A list of conditions evaluated sequentially. The first matching rule applies its `action` (`PASS` or `DROP`).

### The Default Deny Rule
If a packet reaches a targeted workload and does not explicitly match any `PASS` rule, it is dropped by default at the eBPF layer.

## Defining Rules

Rules can be defined at Layer 4 (Network/Transport) or Layer 7 (Application).

### Layer 4 Rules (IP & Port)
L4 rules are the fastest to evaluate, processed directly at the `XDP` or early `TC` hook.

```yaml
rules:
  - action: PASS
    source:
      ip_block: "10.0.1.0/24" # Supports LPM (Longest Prefix Match)
    l4_match:
      protocol: tcp
      port: 5432              # Allow Postgres traffic

```

### Layer 7 Rules (HTTP/gRPC)

L7 rules require deep packet inspection and are evaluated at the `TC` ingress hook. ATRVASA's eBPF parser safely extracts headers without allocating dynamic memory.

```yaml
rules:
  - action: PASS
    source:
      spiffe_id: "spiffe://cluster.local/ns/frontend/sa/web-ui"
    l7_match:
      method: "POST"
      path: "/api/v1/checkout"
      exact: false            # If false, acts as a prefix match (e.g., allows /api/v1/checkout/123)

```

## Comprehensive Example

Below is a complete real-world example. In this scenario, we are protecting a sensitive `payment-service`.

* We allow the `frontend` service to submit payments.
* We allow the monitoring subnet to check the health endpoint.
* All other traffic, including unexpected Shadow API calls, will be dropped instantly.

```yaml
# /policies/payment-service.yaml
apiVersion: atrvasa.dev/v1
kind: ZeroTrustPolicy
metadata:
  name: restrict-payment-api
  description: "Strict mTLS and L7 enforcement for payment processing."
spec:
  target:
    # The workload being protected
    spiffe_id: "spiffe://cluster.local/ns/payments/sa/payment-backend"
    matchLabels:
      app: payment-service

  rules:
    # Rule 1: Allow Frontend to POST to checkout
    - action: PASS
      source:
        spiffe_id: "spiffe://cluster.local/ns/frontend/sa/web-ui"
      l7_match:
        method: "POST"
        path: "/api/v1/checkout"
        exact: true

    # Rule 2: Allow internal monitoring tools to check health
    - action: PASS
      source:
        ip_block: "192.168.100.0/24"
      l7_match:
        method: "GET"
        path: "/healthz"
        exact: true

    # Rule 3: Explicitly drop and log attempts to access deprecated APIs
    - action: DROP
      l7_match:
        path: "/api/v0/"
        exact: false

```

## Applying the Policy

Once your policy is defined, apply it via the CLI. The daemon will resolve the SPIFFE IDs to active IP/Socket descriptors and inject the compiled byte-arrays into the `BPF_MAP_TYPE_HASH`.

```bash
sudo atrvasa policy apply -f payment-service.yaml

```

Check the active kernel rules to verify successful injection:

```bash
sudo atrvasa policy list

```