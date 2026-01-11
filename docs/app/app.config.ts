export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate',
    },
    footer: {
      slots: {
        root: 'border-t border-default',
        left: 'text-sm text-muted',
      },
    },
  },
  seo: {
    siteName: 'NuGrid',
  },
  header: {
    title: '',
    to: '/',
    logo: {
      alt: '',
      light: '',
      dark: '',
    },
    search: true,
    colorMode: true,
    links: [
      {
        'icon': 'i-simple-icons-github',
        'to': 'https://github.com/nu-grid/nu-grid-nuxt',
        'target': '_blank',
        'aria-label': 'GitHub',
      },
    ],
  },
  footer: {
    credits: `Built with Nuxt UI • © ${new Date().getFullYear()}`,
    colorMode: false,
    links: [
      {
        'icon': 'i-simple-icons-discord',
        'to': 'https://go.nuxt.com/discord',
        'target': '_blank',
        'aria-label': 'Nuxt on Discord',
      },
      {
        'icon': 'i-simple-icons-x',
        'to': 'https://go.nuxt.com/x',
        'target': '_blank',
        'aria-label': 'Nuxt on X',
      },
      {
        'icon': 'i-simple-icons-github',
        'to': 'https://github.com/nu-grid/nu-grid-nuxt',
        'target': '_blank',
        'aria-label': 'NuGrid on GitHub',
      },
    ],
  },
  toc: {
    title: 'Table of Contents',
    bottom: {
      title: 'Community',
      edit: 'https://github.com/nu-grid/nu-grid-nuxt/edit/main/docs/content',
      links: [
        {
          icon: 'i-lucide-star',
          label: 'Star on GitHub',
          to: 'https://github.com/nu-grid/nu-grid-nuxt',
          target: '_blank',
        },
        {
          icon: 'i-lucide-book-open',
          label: 'NuGrid docs',
          to: 'https://www.nugrid.dev',
          target: '_blank',
        },
      ],
    },
  },
})
