---
title: Kubernetes Deployment (KinD / Production)
description: Deploy ATRVASA as a Kubernetes DaemonSet using raw manifests or Helm, configuring host namespaces and required eBPF capabilities.
---

# Kubernetes Deployment

In a production or staging Kubernetes environment, ATRVASA runs as a **DaemonSet**. This guarantees that every worker node executes a single instance of the ATRVASA Rust daemon, attaching eBPF programs to the local host interface (`eth0`) and container virtual ethernet pairs (`veth`).
 
## Prerequisites & Privileges

Because eBPF interacts directly with host network interfaces and kernel memory, the DaemonSet pod requires elevated Linux capabilities and host filesystem mounts:

* **Host Namespaces:** `hostNetwork: true` and `hostPID: true` are required for socket tracking across pods.
* **Linux Capabilities:** `CAP_BPF`, `CAP_NET_ADMIN`, `CAP_PERFMON`, and `CAP_SYS_RESOURCE`.
* **BPF File System Mount:** `/sys/fs/bpf` must be mounted from the host into the container to enable map pinning across daemon restarts.
 
## 1. Local Testing Environment (KinD Setup)

To test ATRVASA locally using **KinD (Kubernetes-in-Docker)**, create a cluster configuration file that mounts the host BPF filesystem into the KinD node containers.

Create `kind-config.yaml`:

```yaml
# kind-config.yaml
apiVersion: kind.x-k8s.io/v1alpha4
kind: Cluster
nodes:
  - role: control-plane
    extraMounts:
      - hostPath: /sys/fs/bpf
        containerPath: /sys/fs/bpf
  - role: worker
    extraMounts:
      - hostPath: /sys/fs/bpf
        containerPath: /sys/fs/bpf

```

Spin up the cluster:

```bash
kind create cluster --name atrvasa-test --config kind-config.yaml

```
 
## 2. ATRVASA DaemonSet Manifest

Deploy the ATRVASA control plane daemon using the following production-grade manifest (`atrvasa-daemonset.yaml`):

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: atrvasa-system
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: atrvasa-daemon
  namespace: atrvasa-system
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: atrvasa-node-agent
  namespace: atrvasa-system
  labels:
    app.kubernetes.io/name: atrvasa
spec:
  selector:
    matchLabels:
      app: atrvasa-node-agent
  template:
    metadata:
      labels:
        app: atrvasa-node-agent
    spec:
      serviceAccountName: atrvasa-daemon
      hostNetwork: true
      hostPID: true
      containers:
        - name: atrvasa-agent
          image: ghcr.io/atrvasa/atrvasa-agent:latest
          imagePullPolicy: Always
          securityContext:
            privileged: true
            capabilities:
              add:
                - BPF
                - NET_ADMIN
                - PERFMON
                - SYS_RESOURCE
          volumeMounts:
            - name: bpf-maps
              mountPath: /sys/fs/bpf
              mountPropagation: Bidirectional
            - name: cgroup
              mountPath: /sys/fs/cgroup
              readOnly: true
      volumes:
        - name: bpf-maps
          hostPath:
            path: /sys/fs/bpf
            type: Directory
        - name: cgroup
          hostPath:
            path: /sys/fs/cgroup
            type: Directory

```

Apply the deployment:

```bash
kubectl apply -f atrvasa-daemonset.yaml

```
 
## 3. Verifying Deployment & eBPF Programs

Once the DaemonSet pods are in the `Running` state, you can verify that the eBPF programs have been loaded into the host kernel using `kubectl exec` and `bpftool`:

```bash
# Check DaemonSet status
kubectl get pods -n atrvasa-system -o wide

# Verify loaded eBPF programs on a node pod
kubectl exec -n atrvasa-system daemonset/atrvasa-node-agent -- bpftool prog show

```

**Expected Output:**

```text
102: sched_act  name tc_ingress  tag a3f820c...  gpl
    loaded_at 2026-07-26T04:12:00+0000  uid 0
    xlated 412B  jited 256B  memlock 4096B
103: sock_ops   name sock_ops_prog  tag c821a1f...  gpl
    loaded_at 2026-07-26T04:12:01+0000  uid 0
    xlated 184B  jited 120B  memlock 4096B

```
<!--  AMIN
## Next Steps

Now that ATRVASA is running cluster-wide:

* Refer to the [CLI Reference](https://www.google.com/search?q=/usage/cli-reference) to interact with individual nodes or manage policies via CRDs.
* Explore the [Architecture Overview](https://www.google.com/search?q=/architecture/overview) to learn how ATRVASA synchronizes pod IPs with eBPF maps dynamically. -->
