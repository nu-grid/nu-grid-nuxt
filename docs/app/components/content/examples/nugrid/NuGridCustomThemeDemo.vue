<!--
Tailwind safelist - these classes are used dynamically in theme definitions:
bg-purple-50 bg-purple-100 bg-purple-800 bg-purple-900 bg-purple-950 bg-purple-500/12 bg-purple-500/25
border-purple-300 border-purple-300/50 border-purple-600 border-purple-600/50
text-purple-700 text-purple-300 text-purple-900
hover:bg-purple-100 hover:bg-purple-800 dark:hover:bg-purple-800 dark:bg-purple-900 dark:bg-purple-950

bg-emerald-50 bg-emerald-100 bg-emerald-800 bg-emerald-900 bg-emerald-950 bg-emerald-500/12 bg-emerald-500/25
border-emerald-300 border-emerald-300/50 border-emerald-600 border-emerald-600/50
text-emerald-700 text-emerald-300 text-emerald-900
hover:bg-emerald-100 hover:bg-emerald-800 dark:hover:bg-emerald-800 dark:bg-emerald-900 dark:bg-emerald-950

bg-cyan-50 bg-cyan-100 bg-cyan-800 bg-cyan-900 bg-cyan-950 bg-cyan-500/12 bg-cyan-500/25
border-cyan-300 border-cyan-300/50 border-cyan-600 border-cyan-600/50
text-cyan-700 text-cyan-300 text-cyan-900
hover:bg-cyan-100 hover:bg-cyan-800 dark:hover:bg-cyan-800 dark:bg-cyan-900 dark:bg-cyan-950
-->
<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'
import { createNuGridTheme, getAllThemes, registerTheme } from '#nu-grid/themes'

interface Person {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  joinDate: string
}

const data = ref<Person[]>([
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'Engineer',
    status: 'active',
    joinDate: '2023-01-15',
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'Designer',
    status: 'active',
    joinDate: '2023-03-22',
  },
  {
    id: 3,
    name: 'Carol White',
    email: 'carol@example.com',
    role: 'Manager',
    status: 'inactive',
    joinDate: '2022-11-08',
  },
  {
    id: 4,
    name: 'David Brown',
    email: 'david@example.com',
    role: 'Engineer',
    status: 'active',
    joinDate: '2023-06-01',
  },
  {
    id: 5,
    name: 'Eve Davis',
    email: 'eve@example.com',
    role: 'Product Manager',
    status: 'active',
    joinDate: '2023-02-14',
  },
])

const columns: NuGridColumn<Person>[] = [
  { accessorKey: 'name', header: 'Name', enableSorting: true },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role', enableSorting: true },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const status = getValue() as string
      return status === 'active' ? '✓ Active' : '✗ Inactive'
    },
  },
  { accessorKey: 'joinDate', header: 'Join Date', enableSorting: true },
]

// Register custom themes
const oceanTheme = createNuGridTheme({
  name: 'ocean',
  displayName: 'Ocean',
  description: 'Ocean-inspired theme with cyan accents',
  baseTheme: 'compact',
  slots: {
    base: 'flex flex-col bg-cyan-50 dark:bg-cyan-950',
    th: 'flex shrink-0 items-stretch overflow-hidden p-0! group bg-cyan-100 dark:bg-cyan-900 border-r border-cyan-300 dark:border-cyan-600 last:border-r-0 text-left rtl:text-right text-xs font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wide',
    td: 'flex shrink-0 items-center overflow-hidden border-r border-cyan-300/50 dark:border-cyan-600/50 last:border-r-0 px-2 py-1 whitespace-nowrap text-sm text-cyan-900 dark:text-white outline-none! focus-visible:outline-none!',
    tr: 'flex border-b border-cyan-300 dark:border-cyan-600 hover:bg-cyan-100 dark:hover:bg-cyan-800 outline-none! focus-visible:outline-none!',
    headerContainer: 'flex items-stretch w-full h-full bg-cyan-100 dark:bg-cyan-900',
  },
  variants: {
    focusCell: {
      true: {
        td: 'z-1 shadow-[inset_1px_0_0_0_rgb(6_182_212),inset_-1px_0_0_0_rgb(6_182_212),inset_0_1px_0_0_rgb(6_182_212),inset_0_-1px_0_0_rgb(6_182_212)]',
      },
    },
    focusRow: {
      true: {
        td: 'bg-cyan-500/12 dark:bg-cyan-500/25',
      },
    },
  },
})

const purpleTheme = createNuGridTheme({
  name: 'purple',
  displayName: 'Purple',
  description: 'Purple-themed grid with modern aesthetics',
  baseTheme: 'compact',
  slots: {
    base: 'flex flex-col bg-purple-50 dark:bg-purple-950',
    th: 'flex shrink-0 items-stretch overflow-hidden p-0! group bg-purple-100 dark:bg-purple-900 border-r border-purple-300 dark:border-purple-600 last:border-r-0 text-left rtl:text-right text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide',
    td: 'flex shrink-0 items-center overflow-hidden border-r border-purple-300/50 dark:border-purple-600/50 last:border-r-0 px-2 py-1 whitespace-nowrap text-sm text-purple-900 dark:text-white outline-none! focus-visible:outline-none!',
    tr: 'flex border-b border-purple-300 dark:border-purple-600 hover:bg-purple-100 dark:hover:bg-purple-800 outline-none! focus-visible:outline-none!',
    headerContainer: 'flex items-stretch w-full h-full bg-purple-100 dark:bg-purple-900',
  },
  variants: {
    focusCell: {
      true: {
        td: 'z-1 shadow-[inset_1px_0_0_0_rgb(168_85_247),inset_-1px_0_0_0_rgb(168_85_247),inset_0_1px_0_0_rgb(168_85_247),inset_0_-1px_0_0_rgb(168_85_247)]',
      },
    },
    focusRow: {
      true: {
        td: 'bg-purple-500/12 dark:bg-purple-500/25',
      },
    },
  },
})

const emeraldTheme = createNuGridTheme({
  name: 'emerald',
  displayName: 'Emerald',
  description: 'Fresh emerald green theme',
  baseTheme: 'compact',
  slots: {
    base: 'flex flex-col bg-emerald-50 dark:bg-emerald-950',
    th: 'flex shrink-0 items-stretch overflow-hidden p-0! group bg-emerald-100 dark:bg-emerald-900 border-r border-emerald-300 dark:border-emerald-600 last:border-r-0 text-left rtl:text-right text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide',
    td: 'flex shrink-0 items-center overflow-hidden border-r border-emerald-300/50 dark:border-emerald-600/50 last:border-r-0 px-2 py-1 whitespace-nowrap text-sm text-emerald-900 dark:text-white outline-none! focus-visible:outline-none!',
    tr: 'flex border-b border-emerald-300 dark:border-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-800 outline-none! focus-visible:outline-none!',
    headerContainer: 'flex items-stretch w-full h-full bg-emerald-100 dark:bg-emerald-900',
  },
  variants: {
    focusCell: {
      true: {
        td: 'z-1 shadow-[inset_1px_0_0_0_rgb(16_185_129),inset_-1px_0_0_0_rgb(16_185_129),inset_0_1px_0_0_rgb(16_185_129),inset_0_-1px_0_0_rgb(16_185_129)]',
      },
    },
    focusRow: {
      true: {
        td: 'bg-emerald-500/12 dark:bg-emerald-500/25',
      },
    },
  },
})

// Register the custom themes
registerTheme(oceanTheme)
registerTheme(purpleTheme)
registerTheme(emeraldTheme)

// Theme selection
const selectedTheme = ref<string>('default')

// Get all available themes
const availableThemes = computed(() => {
  return getAllThemes().map((theme) => ({
    value: theme.name,
    label: theme.displayName || theme.name,
  }))
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-sm font-medium">Theme:</span>
      <UFieldGroup>
        <UButton
          v-for="theme in availableThemes"
          :key="theme.value"
          :color="selectedTheme === theme.value ? 'primary' : 'neutral'"
          :variant="selectedTheme === theme.value ? 'solid' : 'outline'"
          size="sm"
          @click="selectedTheme = theme.value"
        >
          {{ theme.label }}
        </UButton>
      </UFieldGroup>
    </div>

    <div class="grid gap-3 md:grid-cols-3 text-sm">
      <div class="rounded-lg border border-default p-3">
        <p class="font-medium">Default Theme</p>
        <p class="text-muted text-xs mt-1">Uses app primary color with comfortable spacing</p>
      </div>
      <div class="rounded-lg border border-default p-3">
        <p class="font-medium">Compact Theme</p>
        <p class="text-muted text-xs mt-1">Blue accent, tighter spacing for dense data</p>
      </div>
      <div class="rounded-lg border border-default p-3">
        <p class="font-medium">Custom Themes</p>
        <p class="text-muted text-xs mt-1">Ocean, Purple, Emerald - extend built-in themes</p>
      </div>
    </div>

    <NuGrid
      :key="selectedTheme"
      :theme="selectedTheme"
      :data="data"
      :columns="columns"
      :focus="{ mode: 'cell' }"
      class="max-h-[300px] rounded border border-default"
    />
  </div>
</template>
