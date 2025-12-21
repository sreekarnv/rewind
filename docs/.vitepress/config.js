import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Rewind',
  description: 'Real-time HTTP Traffic Analyzer Documentation',

  ignoreDeadLinks: [
    // Ignore localhost URLs (these are examples in the docs)
    /^http:\/\/localhost/,
  ],

  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'User Guide', link: '/USER_GUIDE' },
      { text: 'Developer Guide', link: '/DEVELOPER_GUIDE' },
      { text: 'GitHub', link: 'https://github.com/sreekarnv/rewind' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Quick Start', link: '/USER_GUIDE#getting-started' }
        ]
      },
      {
        text: 'User Guide',
        items: [
          { text: 'Overview', link: '/USER_GUIDE' },
          { text: 'Capture Management', link: '/USER_GUIDE#capture-management' },
          { text: 'Session Viewing', link: '/USER_GUIDE#session-viewing' },
          { text: 'Request Replay', link: '/USER_GUIDE#request-replay' },
          { text: 'Alert System', link: '/USER_GUIDE#alert-system' },
          { text: 'Email Notifications', link: '/USER_GUIDE#email-notifications' },
          { text: 'FAQ', link: '/USER_GUIDE#frequently-asked-questions' }
        ]
      },
      {
        text: 'Developer Guide',
        items: [
          { text: 'Overview', link: '/DEVELOPER_GUIDE' },
          { text: 'Architecture', link: '/DEVELOPER_GUIDE#architecture-overview' },
          { text: 'Development Setup', link: '/DEVELOPER_GUIDE#development-setup' },
          { text: 'Core Concepts', link: '/DEVELOPER_GUIDE#core-concepts' },
          { text: 'Adding Features', link: '/DEVELOPER_GUIDE#adding-new-features' },
          { text: 'Testing', link: '/DEVELOPER_GUIDE#testing' },
          { text: 'Deployment', link: '/DEVELOPER_GUIDE#deployment' }
        ]
      },
      {
        text: 'Configuration',
        items: [
          { text: 'Email Setup', link: '/EMAIL_SETUP_GUIDE' },
          { text: 'Alert System', link: '/EMAIL_ALERT_SYSTEM_COMPLETE' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/sreekarnv/rewind' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 Rewind Contributors'
    },

    editLink: {
      pattern: 'https://github.com/sreekarnv/rewind/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    search: {
      provider: 'local'
    }
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]
  ]
})
