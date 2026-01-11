<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const { header } = useAppConfig()
</script>

<template>
  <UHeader :ui="{ center: 'flex-1' }" :to="header?.to || '/'">
    <nav class="hidden lg:flex items-center gap-4 mr-8">
      <NuxtLink
        to="/getting-started"
        class="px-3 py-1.5 text-sm font-medium text-muted hover:text-default rounded-md
          hover:bg-elevated transition-colors"
      >
        Docs
      </NuxtLink>
      <NuxtLink
        to="/demos"
        class="px-3 py-1.5 text-sm font-medium text-muted hover:text-default rounded-md
          hover:bg-elevated transition-colors"
      >
        Demos
      </NuxtLink>
    </nav>

    <UContentSearchButton v-if="header?.search" :collapsed="false" class="max-w-xs" />

    <template v-if="header?.logo?.dark || header?.logo?.light || header?.title" #title>
      <UColorModeImage
        v-if="header?.logo?.dark || header?.logo?.light"
        :light="header?.logo?.light!"
        :dark="header?.logo?.dark!"
        :alt="header?.logo?.alt"
        class="h-6 w-auto shrink-0"
      />

      <span v-else-if="header?.title">
        {{ header.title }}
      </span>
    </template>

    <template v-else #left>
      <NuxtLink :to="header?.to || '/'">
        <AppLogo class="w-auto h-8 shrink-0" />
      </NuxtLink>
    </template>

    <template #right>
      <UContentSearchButton v-if="header?.search" class="lg:hidden" />

      <UColorModeButton v-if="header?.colorMode" />

      <template v-if="header?.links">
        <UButton
          v-for="(link, index) of header.links"
          :key="index"
          v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
        />
      </template>
    </template>

    <template #body>
      <UContentNavigation highlight :navigation="navigation" />
    </template>
  </UHeader>
</template>
