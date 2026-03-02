<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const { header } = useAppConfig()
</script>

<template>
  <UHeader :ui="{ center: 'flex-1' }" :to="header?.to || '/'">
    <nav class="mr-8 hidden items-center gap-4 lg:flex">
      <NuxtLink
        to="/getting-started"
        class="text-muted hover:text-default hover:bg-elevated rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
      >
        Docs
      </NuxtLink>
      <NuxtLink
        to="/demos"
        class="text-muted hover:text-default hover:bg-elevated rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
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
        <AppLogo class="h-8 w-auto shrink-0" />
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
