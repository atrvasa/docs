# Contributing to ATRVASA

First off, thank you for considering contributing to **ATRVASA**! It's people like you that make the open-source community such an amazing place to learn, inspire, and create.

ATRVASA is a high-performance, eBPF-based Zero-Trust Service Mesh Firewall and API Shadow Detector. Because we operate directly within the Linux kernel using Rust and eBPF, we have strict guidelines regarding memory safety, performance overhead, and architectural separation.

Please read through this document to understand our development workflow and coding standards before submitting a Pull Request (PR).



## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Development Setup](#2-development-setup)
3. [Coding Guidelines](#3-coding-guidelines)
4. [The eBPF Verifier Constraints](#4-the-ebpf-verifier-constraints)
5. [Pull Request Process](#5-pull-request-process)
6. [Developer Certificate of Origin (DCO)](#6-developer-certificate-of-origin-dco)



## 1. Architecture Overview

Before contributing, please ensure you understand the ecosystem's dual-plane architecture. ATRVASA is divided into two strict contexts:

* **Kernel-Space (Data Plane):** Located in the `atrvasa-ebpf` crate. This code compiles to eBPF bytecode (`bpfel-unknown-none`). It runs directly inside the kernel (XDP, TC, SockOps hooks).
* **User-Space (Control Plane):** Located in the `atrvasa` crate. This is standard async Rust (using Tokio and Aya). It loads the eBPF programs, manages maps, and evaluates complex OPA policies.

*For a deep dive, please read the [Architecture Documentation](https://atrvasa.com/docs/architecture/overview).*


## 2. Development Setup

To build and test ATRVASA, your local environment must meet the following requirements:

* **Linux Kernel:** `>= 5.8` (Compiled with `CONFIG_DEBUG_INFO_BTF=y`).
* **Rust Toolchains:** * `stable` for the user-space daemon.
    * `nightly` with `rust-src` component for compiling eBPF programs.
* **LLVM & Clang:** Required by the `bpf-linker`.

### Building the Project
We use a `cargo xtask` workflow to simplify compilation.

```bash
# 1. Install the BPF linker
cargo install bpf-linker

# 2. Build the eBPF kernel-space code
cargo xtask build-ebpf --release

# 3. Build the user-space control plane
cargo build --release

```

## 3. Coding Guidelines

We enforce strict formatting and linting rules to maintain a high-quality codebase.

* **Rustfmt:** All Rust code must be formatted. Run `cargo fmt --all` before committing.
* **Clippy:** We aim for zero warnings. Run `cargo clippy --all-targets --all-features -- -D warnings`.
* **Error Handling:** Use explicit `Result` types. Do not use `unwrap()` or `expect()` in production paths, especially in the user-space daemon, as it handles unpredictable kernel map states.
* **Comments:** Write clear, concise English comments. For complex kernel logic, document *why* a specific approach was taken to satisfy the verifier.

## 4. The eBPF Verifier Constraints (CRITICAL)

If you are contributing to the `atrvasa-ebpf` (Kernel-space) crate, you must adhere to the Linux eBPF Verifier rules. **If your code does not pass the verifier, the firewall will fail to load.**

1. **No Dynamic Memory Allocation:** You cannot use `Vec`, `String`, or `Box`. Use fixed-size arrays or eBPF Maps (like `RingBuffer` or `HashMap`).
2. **Strict Bounds Checking:** When parsing packets (e.g., L7 HTTP headers), you must explicitly verify that your pointers do not exceed the `data_end` pointer.
3. **Bounded Loops:** The kernel must guarantee that your program will terminate. Avoid loops if possible. If necessary, ensure they have a strict, statically known maximum iteration limit (often requiring loop unrolling `#pragma unroll`).
4. **No Panics:** The kernel cannot panic. Use safe fallback logic or drop the packet (`XDP_DROP` / `TC_ACT_SHOT`) if an unrecoverable state is reached.

## 5. Pull Request Process

1. **Fork the repo** and create your branch from `main`.
2. **Branch Naming:** Use conventional prefixes: `feature/xyz`, `bugfix/xyz`, or `docs/xyz`.
3. **Write Tests:** If you are adding user-space logic (like OPA compilation), add unit tests.
4. **Update Documentation:** If your change affects the CLI or policy schemas, update the relevant Markdown files in the `docs/` repository.
5. **Commit Messages:** Write descriptive commit messages. We prefer the [Conventional Commits](https://www.conventionalcommits.org/) standard (e.g., `feat(ebpf): add safe HTTP method parser at TC layer`).
6. **Open the PR:** Link to any relevant open issues. A maintainer will review your code.

## 6. Developer Certificate of Origin (DCO) and Licensing

ATRVASA operates on a Multi-License (Open-Core) model:

* eBPF code is licensed under **GPL-2.0**.
* User-space agent code is licensed under **Apache-2.0**.

By contributing to ATRVASA, you agree that your contributions will be licensed under the repository's respective licenses. We require all contributors to sign-off on their commits to certify that they have the right to submit the code.

Simply add the `-s` flag to your `git commit` command:

```bash
git commit -s -m "feat(core): implement L7 payload extraction"

```

*This adds `Signed-off-by: Name <email>` to your commit message.*

```