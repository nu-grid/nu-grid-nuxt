<script setup lang="ts">
import type { NuGridActionMenuItem, NuGridColumn, NuGridRow } from '#nu-grid/types'

interface User {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive'
}

const toast = useToast()

const data = ref<User[]>([
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', status: 'active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', status: 'active' },
  { id: 3, name: 'Carol White', email: 'carol@example.com', status: 'inactive' },
  { id: 4, name: 'David Brown', email: 'david@example.com', status: 'active' },
  { id: 5, name: 'Emma Davis', email: 'emma@example.com', status: 'inactive' },
])

const columns: NuGridColumn<User>[] = [
  { accessorKey: 'id', header: 'ID', size: 60 },
  { accessorKey: 'name', header: 'Name', size: 150 },
  { accessorKey: 'email', header: 'Email', size: 200 },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 100,
    cell: ({ row }) =>
      h(
        'span',
        { class: row.original.status === 'active' ? 'text-success' : 'text-muted' },
        row.original.status,
      ),
  },
]

const columnPinning = ref({ right: ['__actions'] })

function getRowActions(row: NuGridRow<User>): NuGridActionMenuItem[] {
  return [
    { type: 'label', label: 'Actions' },
    {
      label: 'Copy ID',
      icon: 'i-lucide-copy',
      onSelect: () => {
        navigator.clipboard.writeText(String(row.original.id))
        toast.add({ title: 'Copied', description: `ID ${row.original.id} copied to clipboard` })
      },
    },
    {
      label: 'View Details',
      icon: 'i-lucide-eye',
      onSelect: () => {
        toast.add({ title: 'View', description: `Viewing ${row.original.name}` })
      },
    },
    { type: 'separator' },
    {
      label: row.original.status === 'active' ? 'Deactivate' : 'Activate',
      icon: row.original.status === 'active' ? 'i-lucide-user-x' : 'i-lucide-user-check',
      onSelect: () => {
        const user = data.value.find((u) => u.id === row.original.id)
        if (user) {
          user.status = user.status === 'active' ? 'inactive' : 'active'
          toast.add({ title: 'Updated', description: `${user.name} is now ${user.status}` })
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => {
        data.value = data.value.filter((u) => u.id !== row.original.id)
        toast.add({ title: 'Deleted', description: `Removed ${row.original.name}`, color: 'error' })
      },
    },
  ]
}
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-lg border border-default p-3 bg-elevated/30 text-sm">
      <p class="font-medium mb-1">Action Menu Items:</p>
      <ul class="text-xs text-muted space-y-1">
        <li><strong>Copy ID:</strong> Copies user ID to clipboard</li>
        <li><strong>View Details:</strong> Shows user info</li>
        <li><strong>Activate/Deactivate:</strong> Toggles user status</li>
        <li><strong>Delete:</strong> Removes user from list</li>
      </ul>
    </div>

    <NuGrid
      v-model:column-pinning="columnPinning"
      :data="data"
      :columns="columns"
      :actions="{ getActions: getRowActions }"
      :focus="{ mode: 'cell', retain: true }"
    />

    <p class="text-xs text-muted">
      Click the ⋯ button on each row to see the action menu. The action column is pinned to the
      right.
    </p>
  </div>
</template>
