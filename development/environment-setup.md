---
title: Environment Setup
description: Step-by-step guide to preparing your local Linux environment for compiling and developing ATRVASA (Rust & eBPF).
---

# Development Environment Setup

This guide walks you through setting up a complete local development environment for building, debugging, and testing **ATRVASA**.

Because ATRVASA compiles Rust code directly into eBPF bytecode targeting the Linux kernel, your host system requires specific LLVM tools, kernel features, and Rust toolchains.

## 1. System Requirements & OS Support

ATRVASA requires a 64-bit Linux kernel with modern eBPF and BPF Type Format (BTF) support.

* **Operating System:** Linux (Ubuntu 22.04+, Debian 12+, Fedora 38+, or Arch Linux recommended).
* **Linux Kernel:** `>= 5.8` (Kernel 6.x+ highly recommended for optimal ring buffer and TC support).
* **Kernel Configuration:** `CONFIG_DEBUG_INFO_BTF=y` and `CONFIG_NET_CLS_ACT=y`.

You can verify your running kernel version and BTF support with:

```bash
# Check Kernel Version
uname -r

# Verify BTF support (must output 'vmlinux')
ls -l /sys/kernel/btf/vmlinux

```

## 2. Installing System Packages

Install the required C toolchain, LLVM dependencies, headers, and eBPF debugging utilities for your distribution.

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y \
    build-essential \
    clang \
    llvm \
    libclang-dev \
    libbpf-dev \
    linux-headers-$(uname -r) \
    iproute2 \
    bpftool \
    pkg-config \
    git \
    curl

```

### Fedora / RHEL

```bash
sudo dnf install -y \
    gcc \
    clang \
    llvm \
    llvm-devel \
    libbpf-devel \
    kernel-devel \
    iproute \
    bpftool \
    pkg-config \
    git \
    curl

```

### Arch Linux

```bash
sudo pacman -S --needed \
    base-devel \
    clang \
    llvm \
    libbpf \
    linux-headers \
    iproute2 \
    bpf \
    git \
    curl

```

## 3. Rust Toolchain Configuration

ATRVASA utilizes a dual-toolchain setup:

1. **`stable`:** Compiles the user-space daemon, CLI, and policy compiler.
2. **`nightly` + `rust-src`:** Compiles the core kernel-space eBPF programs into the `bpfel-unknown-none` target.

### Step 1: Install Rustup

If you haven't installed Rust yet, run:

```bash
curl --proto '=https' --tlsv1.2 -sSf [https://sh.rustup.rs](https://sh.rustup.rs) | sh
source $HOME/.cargo/env

```

### Step 2: Install Nightly & Target Components

Add the `nightly` toolchain and the required `rust-src` component:

```bash
# Install rust-src for the nightly toolchain (required for no_std eBPF targets)
rustup toolchain install nightly
rustup component add rust-src --toolchain nightly

```

### Step 3: Install `bpf-linker`

`bpf-linker` is a dedicated LLVM-based linker designed to output safe BPF bytecode.

```bash
cargo install bpf-linker

```

*Note: If `bpf-linker` fails to compile, ensure `libclang-dev` and `llvm` are installed on your host system.*

## 4. BPF Filesystem Setup

ATRVASA pins eBPF maps to the host's BPF virtual filesystem (`/sys/fs/bpf`). Ensure this filesystem is mounted:

```bash
# Verify mount
mount | grep /sys/fs/bpf

# If not mounted, mount it manually:
sudo mount -t bpf bpf /sys/fs/bpf

```

To make this mount persistent across reboots, add the following entry to `/etc/fstab`:

```text
bpf /sys/fs/bpf bpf defaults 0 0

```

## 5. Verifying Your Setup

Once all prerequisites are installed, clone the repository and run the build sanity check using the `cargo xtask` workflow.

```bash
# Clone repository
git clone [https://github.com/atrvasa/atrvasa.git](https://github.com/atrvasa/atrvasa.git)
cd atrvasa

# 1. Build the eBPF kernel bytecodes (Kernel-space)
cargo xtask build-ebpf

# 2. Build the user-space daemon & CLI (User-space)
cargo build

```

If both commands finish without errors, your development environment is fully operational!


## 6. Troubleshooting Common Issues

### Issue: `bpf-linker: command not found`

Ensure Cargo's bin directory is in your system `PATH`:

```bash
export PATH="$HOME/.cargo/bin:$PATH"

```

### Issue: `failed to find vmlinux or BTF info`

Your running kernel was compiled without `CONFIG_DEBUG_INFO_BTF`. If running inside a virtual machine (WSL2 / Docker), ensure you are using a standard Linux kernel image or update your kernel.

### Issue: `Permission denied (os error 13)`

eBPF loading requires root privileges. Ensure you run the executable with `sudo`:

```bash
sudo RUST_LOG=info target/release/atrvasa daemon start

```

## Next Steps

Now that your local environment is ready:

* Read the [Contributing Guidelines](https://www.google.com/search?q=./contributing) to learn about our PR workflow.
* Learn about the project's crate organization in [Project Structure](https://www.google.com/search?q=./project-structure).