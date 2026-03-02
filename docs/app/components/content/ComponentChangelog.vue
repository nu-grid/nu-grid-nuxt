<script setup lang="ts">
import { camelCase, upperFirst } from 'scule'

const props = defineProps<{
  prefix?: string
}>()

const route = useRoute()
const name = route.path.split('/').pop() ?? ''
const camelName = upperFirst(camelCase(name))

const { data: commits } = await useLazyFetch('/api/github/commits', {
  key: `component-changelog-${name}`,
  query: {
    path: `src/runtime/components/${props.prefix ? `${props.prefix}/` : ''}${camelName}.vue`,
  },
})

function normalizeCommitMessage(commit: { sha: string; message: string }) {
  const prefix = `[\`${commit.sha.slice(0, 5)}\`](https://github.com/nu-grid/nu/grid-nuxt/commit/${commit.sha})`
  const content = commit.message
    .replace(/\(.*?\)/, '')
    .replace(/#(\d+)/g, "<a href='https://github.com/nu-grid/nu-grid-nuxt/issues/$1'>#$1</a>")
    .replace(/`(.*?)`/g, '<code class="text-xs">$1</code>')

  return `${prefix} — ${content}`
}
</script>

<template>
  <div v-if="!commits?.length">No recent changes</div>

  <div class="relative flex flex-col gap-1.5">
    <div class="bg-accented absolute left-[11px] z-[-1] h-full w-px" />

    <template v-for="commit of commits" :key="commit.sha">
      <div class="flex items-center gap-1.5">
        <div class="bg-accented ring-bg mx-[8.5px] size-1.5 rounded-full ring-2" />
        <MDC
          :value="normalizeCommitMessage(commit)"
          class="text-sm [&_code]:text-xs [&>*]:my-0 [&>*]:py-0"
          tag="div"
        />
      </div>
    </template>
  </div>
</template>
