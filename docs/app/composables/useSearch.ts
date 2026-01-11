import type { UIMessage } from 'ai'

export function useSearch() {
  const route = useRoute()
  const { frameworks } = useFrameworks()

  const chat = ref(false)
  const fullscreen = ref(false)
  const searchTerm = ref('')
  const messages = ref<UIMessage[]>([])

  function onSelect(e: any) {
    e.preventDefault()

    messages.value = searchTerm.value
      ? [
          {
            id: '1',
            role: 'user',
            parts: [{ type: 'text', text: searchTerm.value }],
          },
        ]
      : [
          {
            id: '1',
            role: 'assistant',
            parts: [{ type: 'text', text: 'Hello, how can I help you today?' }],
          },
        ]

    chat.value = true
  }

  const links = computed(() =>
    [
      !searchTerm.value && {
        label: 'Get Started',
        description: 'Learn how to get started with Nuxt UI.',
        icon: 'i-lucide-square-play',
        to: '/docs/getting-started',
        active: route.path.startsWith('/docs/getting-started'),
      },
      {
        label: 'Releases',
        description:
          'Stay up to date with the newest features, enhancements, and fixes for Nuxt UI.',
        icon: 'i-lucide-newspaper',
        to: '/releases',
      },
      {
        label: 'GitHub',
        description: 'Check out the NuGrid repository and follow development on GitHub.',
        icon: 'i-simple-icons-github',
        to: 'https://github.com/nu-grid/nu-grid-nuxt/releases',
        target: '_blank',
      },
    ].filter((link) => !!link),
  )

  const groups = computed(() => [
    {
      id: 'ai',
      label: 'AI',
      ignoreFilter: true,
      postFilter: (searchTerm: string, items: any[]) => {
        if (!searchTerm) {
          return []
        }

        return items
      },
      items: [
        {
          label: 'Ask AI',
          icon: 'i-lucide-bot',
          ui: {
            itemLeadingIcon: 'group-data-highlighted:not-group-data-disabled:text-primary',
          },
          onSelect,
        },
      ],
    },
    {
      id: 'framework',
      label: 'Framework',
      items: frameworks.value,
    },
  ])

  return {
    links,
    groups,
    chat,
    fullscreen,
    searchTerm,
    messages,
  }
}
