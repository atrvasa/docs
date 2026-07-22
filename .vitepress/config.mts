import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "ATRVASA",
  description: "atrvasa",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/guide/' },
      { text: 'Blog', link: '/blog/' }
    ],

    sidebar: {
      // سایدبار مخصوص بخش مستندات محصول
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is ATRVASA?', link: '/guide/' },
            { text: 'Architecture', link: '/guide/architecture' },
            { text: 'Getting Started', link: '/guide/getting-started' }
          ]
        }
      ],
      
      // سایدبار مخصوص بخش مقالات (وبلاگ)
      '/blog/': [
        {
          text: 'Rust Mastery',
          collapsed: false,
          items: [
            { text: 'Syntax & Structs', link: '/blog/01-rust-mastery/syntax-structs' },
            { text: 'Ownership & Borrowing', link: '/blog/01-rust-mastery/ownership' },
            { text: 'Lifetimes', link: '/blog/01-rust-mastery/lifetimes' },
          ]
        },
        {
          text: 'Linux & eBPF Concepts',
          collapsed: true,
          items: [
            { text: 'Userspace vs Kernel', link: '/blog/02-linux-ebpf/userspace-vs-kernel' },
            { text: 'eBPF Architecture', link: '/blog/02-linux-ebpf/ebpf-architecture' },
          ]
        },
        {
          text: 'Aya Framework',
          collapsed: true,
          items: [
            { text: 'Aya Architecture', link: '/blog/03-aya-framework/aya-architecture' },
          ]
        },
        {
          text: 'Building the Product',
          collapsed: true,
          items: [
            { text: 'XDP Optimization', link: '/blog/04-building-product/xdp-optimization' },
            { text: 'CI/CD for eBPF', link: '/blog/04-building-product/github-actions-cicd' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/atrvasa' }
    ],

    footer: {
      // message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 ATRVASA Contributors'
    }
  }
})
