<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface User {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive' | 'pending'
  avatar: string
}

const data = ref<User[]>([
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    status: 'active',
    avatar: 'https://i.pravatar.cc/32?u=alice',
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    status: 'inactive',
    avatar: 'https://i.pravatar.cc/32?u=bob',
  },
  {
    id: 3,
    name: 'Carol White',
    email: 'carol@example.com',
    status: 'pending',
    avatar: 'https://i.pravatar.cc/32?u=carol',
  },
  {
    id: 4,
    name: 'David Brown',
    email: 'david@example.com',
    status: 'active',
    avatar: 'https://i.pravatar.cc/32?u=david',
  },
  {
    id: 5,
    name: 'Eve Wilson',
    email: 'eve@example.com',
    status: 'active',
    avatar: 'https://i.pravatar.cc/32?u=eve',
  },
])

const columns: NuGridColumn<User>[] = [
  { accessorKey: 'id', header: 'ID', size: 60 },
  { accessorKey: 'name', header: 'Name', size: 180 },
  { accessorKey: 'email', header: 'Email', size: 200 },
  { accessorKey: 'status', header: 'Status', size: 120 },
]

const statusColors: Record<string, 'success' | 'error' | 'warning'> = {
  active: 'success',
  inactive: 'error',
  pending: 'warning',
}
</script>

<template>
  <div class="w-full">
    <NuGrid
      :data="data"
      :columns="columns"
      :ui="{
        base: 'w-full border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50',
        th: 'py-2 border-y border-default first:border-l last:border-r first:rounded-l-lg last:rounded-r-lg',
        td: 'border-b border-default',
      }"
    >
      <!-- Custom name cell with avatar -->
      <template #name-cell="{ value, row }">
        <div class="flex items-center gap-2">
          <UAvatar :src="row.original.avatar" size="2xs" />
          <span>{{ value }}</span>
        </div>
      </template>

      <!-- Custom status cell with badge -->
      <template #status-cell="{ value }">
        <UBadge :color="statusColors[value as string]" variant="subtle" size="sm">
          {{ value }}
        </UBadge>
      </template>
    </NuGrid>
  </div>
</template>
