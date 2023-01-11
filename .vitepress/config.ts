import fs from 'fs'
import path from 'path'
import { defineConfigWithTheme } from 'vitepress'
import type { Config as ThemeConfig } from '@atrvasa/theme'
import baseConfig from '@atrvasa/theme/config'

const nav: ThemeConfig['nav'] = [
  {
    text: 'Docs',
    activeMatch: `^/(guide|tutorials|examples|concepts)/`,
    items: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Quick Start', link: '/guide/quick-start' },
      { text: 'Concepts', link: '/concepts/api' }
    ]
  },
  {
    text: 'Infrastructure',
    activeMatch: `^/infra/`,
    items: [{ text: 'Java', link: '/infra/java/' }]
  },
  {
    text: 'Plugins',
    activeMatch: `^/plugins/`,
    items: [
      {
        text: 'Infrastructure Plugins',
        items: [
          { text: 'Users', link: '/plugins/users-mgr/' },
          { text: 'Permissions', link: '/plugins/permission/' },
          { text: 'Bundling', link: '/plugins/bundling/' },
          { text: 'Occur', link: '/plugins/occur/' }
        ]
      },
      {
        text: 'Released Plugins',
        items: [
          { text: 'Audience', link: '/plugins/audience/' },
          { text: 'Parameter', link: '/plugins/parameter/' },
          { text: 'Structure', link: '/plugins/structure/' }
        ]
      },
      {
        text: 'In Progress Plugins',
        items: [
          { text: 'EDMS', link: '/plugins/edms/' },
          { text: 'Organizational Chart', link: '/plugins/org-chart/' },
          { text: 'Report Generator', link: '/plugins/report-generator/' },
          { text: 'BMPS', link: '/plugins/bpms/' }
        ]
      }
    ]
  },
  {
    text: 'About',
    activeMatch: `^/about/`,
    items: [
      { text: 'FAQ', link: '/about/faq' },
      { text: 'Team', link: '/about/team' },
      { text: 'Releases', link: '/about/releases' },
      {
        text: 'Community Guide',
        link: '/about/community-guide'
      },
      { text: 'Code of Conduct', link: '/about/coc' }
    ]
  },
  {
    text: 'Contact',
    activeMatch: `^/contact/`,
    items: [
      {
        text: 'Help',
        items: [
          {
            text: 'GitHub Discussions',
            link: 'https://github.com/atrvasa/core/discussions'
          },
          { text: 'DEV Community', link: 'https://dev.to/atrvasa' }
        ]
      },
      {
        text: 'News',
        items: [{ text: 'Twitter', link: 'https://twitter.com/atrvasa' }]
      }
    ]
  },
  {
    text: 'Sponsor',
    link: '/sponsor/'
  }
]

export const sidebar: ThemeConfig['sidebar'] = {
  '/guide/': [
    {
      text: 'Getting Started',
      items: [
        { text: 'Introduction', link: '/guide/introduction' },
        {
          text: 'Quick Start',
          link: '/guide/quick-start'
        }
      ]
    },
    {
      text: 'Essentials',
      items: [
        { text: 'Core', link: '/guide/essentials/core' },
        { text: 'GUI', link: '/guide/essentials/gui' },
        { text: 'How Atrvasa Works', link: '/guide/essentials/how-works' },
        { text: 'Plugins Declaration', link: '/guide/essentials/plugins' },
        { text: "What's Occur", link: '/guide/essentials/occur' },
        {
          text: 'Request & Response',
          link: '/guide/essentials/request-response'
        },
        { text: 'Services', link: '/guide/essentials/services' },
        { text: "What's Delegate", link: '/guide/essentials/delegate' }
      ]
    },
    {
      text: 'API',
      items: [
        {
          text: 'Plugin Caller',
          link: '/guide/api/plugin-caller'
        },
        {
          text: 'Qasedak Caller',
          link: '/guide/api/qasedak-caller'
        }
      ]
    }
  ],
  '/plugins/users-mgr/': [
    {
      text: 'Getting Started',
      items: [
        { text: 'Introduction', link: '/plugins/users-mgr/index' },
        { text: 'Quick Start', link: '/plugins/users-mgr/quick-start' }
      ]
    },
    {
      text: 'Essentials',
      items: [
        {
          text: 'How to create new user',
          link: '/plugins//users-mgr/essentials/create-new-user'
        },
        {
          text: 'How to login and logout',
          link: '/plugins//users-mgr/essentials/login-logout'
        }
      ]
    },
    {
      text: 'API',
      items: [
        {
          text: 'User Login',
          link: '/plugins/users-mgr/api/user-login'
        },
        {
          text: 'Register User',
          link: '/plugins/users-mgr/api/register-user'
        },
        { text: 'User', link: '/plugins/users-mgr/api/user' },
        { text: 'Role', link: '/plugins/users-mgr/api/role' },
        {
          text: 'User Session',
          link: '/plugins/users-mgr/api/user-session'
        }
      ]
    }
  ],
  '/infra/java/': [
    {
      text: 'Java Framework',
      items: [
        { text: 'Introduction', link: '/infra/java/index' },
        { text: 'Quick Start', link: '/infra/java/quick-start' }
      ]
    },
    {
      text: 'Essentials',
      items: [
        { text: 'Entity', link: '/infra/java/essentials/entity' },
        {
          text: 'Entity Behavior',
          link: '/infra/java/essentials/behavior'
        },
        {
          text: 'Entity Services',
          link: '/infra/java/essentials/service'
        },
        { text: 'Add Delegate', link: '/infra/java/essentials/delegate' },
        { text: 'Add Exception', link: '/infra/java/essentials/exception' }
      ]
    }
  ],
  '/infra/rust/': [
    {
      text: 'Rust Framework',
      items: [
        { text: 'Introduction', link: '/infra/rust/index' },
        { text: 'Quick Start', link: '/infra/rust/quick-start' }
      ]
    }
  ],
  '/concepts/': [
    {
      text: 'Concepts',
      items: [
        { text: 'API', link: '/concepts/api' },
        { text: 'Rest API', link: '/concepts/rest-api' },
        { text: 'Microservices', link: '/concepts/micro-services' },
        { text: 'API Management', link: '/concepts/api-management' }
      ]
    }
  ]
}

export default defineConfigWithTheme<ThemeConfig>({
  extends: baseConfig,

  lang: 'en-US',
  title: 'Atrvasa',
  description: 'Atrvasa - The Growing cross-platform ecosystem',
  srcDir: 'src',
  srcExclude: ['tutorial/**/description.md'],
  scrollOffset: 'header',

  head: [
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    ['meta', { name: 'twitter:site', content: '@atrvasa' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    [
      'meta',
      {
        name: 'twitter:image',
        content: 'https://atrvasa.com/images/logo.png'
      }
    ],
    [
      'link',
      {
        rel: 'preconnect',
        href: 'https://sponsors.atrvasa.com'
      }
    ],
    [
      'script',
      {},
      fs.readFileSync(
        path.resolve(__dirname, './inlined-scripts/restorePreference.js'),
        'utf-8'
      )
    ],
    [
      'script',
      {
        src: 'https://cdn.usefathom.com/script.js',
        'data-site': 'XNOLWPLB',
        'data-spa': 'auto',
        defer: ''
      }
    ]
  ],

  themeConfig: {
    nav,
    sidebar,

    localeLinks: [
      {
        link: 'https://fa.atrvasa.com',
        text: 'فارسی',
        repo: 'https://github.com/atrvasa-translations/docs-fa'
      },
      {
        link: 'https://de.atrvasa.com',
        text: 'Germany',
        repo: 'https://github.com/atrvasa-translations/docs-de'
      },
      {
        link: '/translations/',
        text: 'Help Us Translate!',
        isTranslationsDesc: true
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/atrvasa/' },
      { icon: 'twitter', link: 'https://twitter.com/atrvasa' }
    ],

    editLink: {
      repo: 'atrvasa/docs',
      text: 'Edit this page on GitHub'
    },

    footer: {
      license: {
        text: 'MIT License',
        link: 'https://opensource.org/licenses/MIT'
      },
      copyright: `Copyright © 2020-${new Date().getFullYear()} Keykhosrow`
    }
  },

  markdown: {},

  vite: {
    define: {
      __VUE_OPTIONS_API__: false
    },
    optimizeDeps: {
      include: ['gsap', 'dynamics.js'],
      exclude: ['@vue/repl']
    },
    // @ts-ignore
    ssr: {
      external: ['@vue/repl']
    },
    server: {
      host: true,
      fs: {
        // for when developing with locally linked theme
        allow: ['../..']
      }
    },
    build: {
      minify: 'terser',
      chunkSizeWarningLimit: Infinity
    },
    json: {
      stringify: true
    }
  },

  vue: {
    reactivityTransform: true
  }
})
