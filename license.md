# ATRVASA Licensing Information

The ATRVASA ecosystem adopts an **Open-Core** licensing model. This approach allows us to provide a highly performant, open-source data plane for the community while ensuring the sustainable development of our enterprise-grade control plane and management interfaces.

Because the ecosystem is distributed across multiple repositories, different components are governed by different licenses. Please refer to the breakdown below.

---

## 1. Core Data Plane (`atrvasa`)
**Repository:** [atrvasa](https://github.com/atrvasa/atrvasa)

The core data plane agent operates at both the user-space and kernel-space levels. To comply with Linux kernel requirements and maximize open-source adoption, this repository is **Multi-Licensed**:

* **Kernel-Space eBPF Code (`/bpf/`):** Licensed under the **GNU General Public License v2.0 (GPL-2.0)**. This ensures compatibility with the Linux kernel's BPF verifier and helper functions.
* **User-Space Rust Agent (`/src/`):** Licensed under the **Apache License 2.0**. This allows developers and enterprises to integrate the user-space agent into their own infrastructure permissively.

*See the `LICENSE-APACHE` and `LICENSE-GPL` files within the `atrvasa` repository for full details.*

---

## 2. Management & Control Plane (`control-plane` & `dashboard`)
**Repositories:** [control-plane](https://github.com/atrvasa/control-plane), [dashboard](https://github.com/atrvasa/dashboard)

The centralized intelligence, policy engine, and graphical web management dashboard are licensed under the **Business Source License (BSL) 1.1**.

**What this means:**
* You are free to view, download, modify, and run the code for internal, non-production, and testing purposes.
* You **may not** offer this software to third parties as a hosted or managed service (SaaS) that competes with ATRVASA's commercial offerings.
* (Optional: *After a period of 4 years from the date of each release, the license for that specific version automatically converts to the permissive Apache License 2.0.*)

*See the `LICENSE` file in the respective repositories for the specific BSL terms and use limitations.*

---

## 3. Official Documentation & Blog (`docs`)
**Repository:** [docs](https://github.com/atrvasa/docs)

We believe in open education and sharing our engineering knowledge regarding Rust, eBPF, and System Architecture. 

* **Documentation Content & Blog Articles:** Licensed under **Creative Commons Attribution 4.0 International (CC-BY-4.0)**. You are free to share and adapt the content, provided you give appropriate credit to ATRVASA and the original authors.
* **Website Source Code (VitePress/Theme):** Licensed under the **MIT License**.

---

## 4. Testing & Demo Environment (`demo-microservices`)
**Repository:** [demo-microservices](https://github.com/atrvasa/demo-microservices)

The vulnerable sandbox environment used for demonstrating Zero-Trust capabilities and Shadow API detection is completely permissive.

* Licensed under the **Apache License 2.0**. You are free to clone, modify, and deploy this testing suite without restriction.

---

## Contributions

We welcome contributions to our open-source components! By contributing to any of the ATRVASA repositories, you agree that your contributions will be licensed under the respective repository's designated license(s). 

For enterprise licensing, commercial support, or SaaS inquiries regarding the Control Plane and Dashboard, please contact us at [Your Contact Email/Link].