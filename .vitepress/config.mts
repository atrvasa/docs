import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "ATRVASA",
  description: "eBPF-powered, Rust-native Zero-Trust Security Ecosystem",

  // Core configurations
  lang: 'en-US',
  lastUpdated: true, // Displays the last update time of each page based on git commits
  cleanUrls: true, // Removes .html from the URLs for a cleaner look

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    // Top-level navigation menu
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/introduction', activeMatch: '/guide/' },
      { text: 'Architecture', link: '/architecture/overview', activeMatch: '/architecture/' },
      { text: 'Usage / CLI', link: '/usage/cli-reference', activeMatch: '/usage/' },
      { text: 'Development', link: '/development/contributing' },
      { text: 'Blog', link: '/blog/' },
      // { text: 'Sponsor 💖', link: '/sponsor' } 
    ],

    // Contextual sidebar menus based on the current route
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          collapsed: false,
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Prerequisites & Kernel Requirements', link: '/guide/prerequisites' },
            { text: 'Quickstart Guide', link: '/guide/quickstart' }
          ]
        },
        {
          text: 'Core Concepts',
          collapsed: false,
          items: [
            { text: 'Sidecarless Architecture', link: '/guide/concepts/sidecarless' },
            { text: 'Zero-Trust Model in eBPF', link: '/guide/concepts/zero-trust' },
            { text: 'eBPF Hooks & Kernel Bypass', link: '/guide/concepts/ebpf-hooks' }
          ]
        },
        {
          text: 'Ecosystem Components',
          collapsed: false,
          items: [
            { text: 'eBPF Firewall Engine', link: '/guide/components/firewall' },
            { text: 'API Shadow Detector', link: '/guide/components/shadow-detector' },
            { text: 'Embedded OPA Engine', link: '/guide/components/opa-engine' }
          ]
        },
        {
          text: 'Case Study & Deployment',
          collapsed: false,
          items: [
            { text: 'Interoperability Scenario', link: '/guide/deployment/case-study' },
            { text: 'Kubernetes (KinD) Setup', link: '/guide/deployment/kubernetes' }
          ]
        }
      ],
      '/architecture/': [
        {
          text: 'System Architecture',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/architecture/overview' },
            { text: 'eBPF Data Plane', link: '/architecture/data-plane' },
            { text: 'Rust Control Plane', link: '/architecture/control-plane' }
          ]
        }
      ],
      '/usage/': [
        {
          text: 'Operations & Reference',
          collapsed: false,
          items: [
            { text: 'CLI Reference', link: '/usage/cli-reference' },
            { text: 'Policy Configuration', link: '/usage/policy-config' }
          ]
        }
      ],
      '/development/': [
        {
          text: 'Developer Guide',
          collapsed: false,
          items: [
            { text: 'Contributing Guidelines', link: '/development/contributing' },
            { text: 'Environment Setup', link: '/development/environment-setup' },
            { text: 'Project Structure', link: '/development/project-structure' }
          ]
        }
      ]
    },

    // Repository links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/atrvasa/atrvasa' } // Update with your actual repo
    ],

    // Footer configuration
    footer: {
      message: 'Released under <a href="/license">Multiple Licenses</a> (Open-Core model).',
      copyright: 'Copyright © 2024-present ATRVASA Contributors'
    },

    // Built-in local search for fast indexing without external dependencies like Algolia
    search: {
      provider: 'local'
    },

    // Outline depth for the right-side table of contents
    outline: {
      level: [2, 3],
      label: 'On this page'
    }
  }
})