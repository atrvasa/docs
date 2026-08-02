---
title: Prerequisites & Requirements
description: System requirements, supported Linux kernel versions, and development toolchains needed to run and compile the ATRVASA ecosystem.
---

# Prerequisites & Kernel Requirements

Because ATRVASA operates directly at the kernel level using advanced eBPF features, it requires specific Linux kernel capabilities and a modern development toolchain. 

Whether you are deploying the pre-compiled binaries or building ATRVASA from source, please ensure your environment meets the following requirements.
 

## 1. Linux Kernel Requirements

ATRVASA utilizes modern eBPF map types (such as Ring Buffers for the Shadow API Detector) and BPF Type Format (BTF) for kernel portability without requiring local kernel headers.

* **Minimum Kernel Version:** Linux Kernel **5.8** (Required for `BPF_MAP_TYPE_RINGBUF`).
* **Recommended Kernel Version:** Linux Kernel **5.15 LTS or newer** (Provides mature CO-RE support, `bpf_link` attachments, and improved TC/SockOps performance).
* **BTF Support:** The kernel must be compiled with `CONFIG_DEBUG_INFO_BTF=y`. You can verify this by checking if the BTF file exists on your system:
  
```bash
  ls -l /sys/kernel/btf/vmlinux

```

*(If missing, ATRVASA cannot perform CO-RE relocations and will fail to load the eBPF bytecode).*


## 2. System Privileges

Loading eBPF programs into the kernel and intercepting network traffic via Traffic Control (TC) or sockets requires elevated privileges.

The ATRVASA daemon must be executed with either:

* **`root` (sudo)** access, OR
* Specific Linux capabilities: `CAP_BPF`, `CAP_NET_ADMIN`, and `CAP_PERFMON`.


## 3. Development Toolchain (For Building from Source)

If you plan to compile ATRVASA, modify the Rust control-plane, or tweak the eBPF C/Rust data-plane, you will need the following dependencies installed on your build machine.

### A. Rust & Cargo

ATRVASA is built with Rust and relies on the [Aya](https://www.google.com/search?q=https://aya-rs.dev/) framework for eBPF interoperability.

```bash
# Install the standard Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf [https://sh.rustup.rs](https://sh.rustup.rs) | sh

# Install the rust-src component (Required by Aya for eBPF targets)
rustup component add rust-src --toolchain nightly

```

*Note: ATRVASA compiles its user-space daemon on the `stable` channel, but compiling the eBPF bytecode currently requires the `nightly` channel.*

### B. LLVM & Clang

Even though ATRVASA is Rust-native, the LLVM compiler infrastructure is required to link and compile BPF bytecode target architectures (`bpfel-unknown-none` or `bpfeb-unknown-none`).

* **Ubuntu / Debian:**
```bash
sudo apt install llvm clang

```


* **Fedora / RHEL:**
```bash
sudo dnf install llvm clang

```


* **Arch Linux:**
```bash
sudo pacman -S llvm clang

```



### C. bpftool (Optional but Recommended)

For debugging and inspecting eBPF maps and programs attached by ATRVASA, the official Linux `bpftool` is highly recommended.

```bash
# Ubuntu/Debian
sudo apt install linux-tools-common linux-tools-generic

# Verify installation
bpftool prog show

```
 

## Next Steps

Once your environment is ready and your kernel supports the required eBPF features, you can proceed to the [Quickstart Guide](https://www.google.com/search?q=./quickstart) to deploy the ATRVASA ecosystem.
