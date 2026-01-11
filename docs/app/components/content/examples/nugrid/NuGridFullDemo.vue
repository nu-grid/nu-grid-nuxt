<script setup lang="ts">
import type { NuGridActionMenuItem, NuGridColumn, NuGridRow } from '#nu-grid/types'

interface User {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive' | 'pending'
  role: string
  department: string
}

const toast = useToast()
const gridRef = useTemplateRef('grid')

const data = ref<User[]>([
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    status: 'active',
    role: 'Developer',
    department: 'Engineering',
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    status: 'active',
    role: 'Designer',
    department: 'Design',
  },
  {
    id: 3,
    name: 'Carol White',
    email: 'carol@example.com',
    status: 'pending',
    role: 'Manager',
    department: 'Sales',
  },
  {
    id: 4,
    name: 'David Brown',
    email: 'david@example.com',
    status: 'inactive',
    role: 'Analyst',
    department: 'Finance',
  },
  {
    id: 5,
    name: 'Emma Davis',
    email: 'emma@example.com',
    status: 'active',
    role: 'Developer',
    department: 'Engineering',
  },
  {
    id: 6,
    name: 'Frank Miller',
    email: 'frank@example.com',
    status: 'active',
    role: 'HR Specialist',
    department: 'HR',
  },
  {
    id: 7,
    name: 'Grace Lee',
    email: 'grace@example.com',
    status: 'pending',
    role: 'Developer',
    department: 'Engineering',
  },
  {
    id: 8,
    name: 'Henry Wilson',
    email: 'henry@example.com',
    status: 'active',
    role: 'Designer',
    department: 'Design',
  },
  {
    id: 9,
    name: 'Ivy Chen',
    email: 'ivy@example.com',
    status: 'active',
    role: 'Manager',
    department: 'Engineering',
  },
  {
    id: 10,
    name: 'Jack Taylor',
    email: 'jack@example.com',
    status: 'inactive',
    role: 'Analyst',
    department: 'Finance',
  },
])

const columns: NuGridColumn<User>[] = [
  { accessorKey: 'id', header: 'ID', size: 60, enableEditing: false },
  { accessorKey: 'name', header: 'Name', size: 150 },
  { accessorKey: 'email', header: 'Email', size: 200 },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 100,
    cell: ({ row }) => {
      const colors: Record<string, string> = {
        active: 'text-success',
        inactive: 'text-error',
        pending: 'text-warning',
      }
      return h('span', { class: `capitalize ${colors[row.original.status]}` }, row.original.status)
    },
  },
  { accessorKey: 'role', header: 'Role', size: 120 },
  { accessorKey: 'department', header: 'Department', size: 120 },
]

const rowSelection = ref({})
const columnPinning = ref({ left: ['__selection', 'id'], right: ['__actions'] })
const emailFilter = ref('')
const editingEnabled = ref(true)
const focusMode = ref<'cell' | 'row'>('cell')

function getRowActions(row: NuGridRow<User>): NuGridActionMenuItem[] {
  return [
    { type: 'label', label: 'Actions' },
    {
      label: 'Copy ID',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(row.original.id.toString())
        toast.add({ title: 'Copied', description: `ID ${row.original.id} copied to clipboard` })
      },
    },
    { type: 'separator' },
    { label: 'View Details', icon: 'i-lucide-eye' },
    { type: 'separator' },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        data.value = data.value.filter((u) => u.id !== row.original.id)
        toast.add({ title: 'Deleted', description: `User ${row.original.name} removed` })
      },
    },
  ]
}

const selectedCount = computed(() => {
  return Object.values(rowSelection.value).filter(Boolean).length
})

watch(emailFilter, (value) => {
  gridRef.value?.tableApi?.getColumn('email')?.setFilterValue(value)
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <UInput
        v-model="emailFilter"
        icon="i-lucide-search"
        placeholder="Filter emails..."
        class="w-64"
      />

      <UButton
        :color="editingEnabled ? 'primary' : 'neutral'"
        :variant="editingEnabled ? 'solid' : 'outline'"
        size="sm"
        @click="editingEnabled = !editingEnabled"
      >
        {{ editingEnabled ? 'Editing On' : 'Editing Off' }}
      </UButton>

      <UFieldGroup>
        <UButton
          :color="focusMode === 'cell' ? 'primary' : 'neutral'"
          :variant="focusMode === 'cell' ? 'solid' : 'outline'"
          size="sm"
          @click="focusMode = 'cell'"
        >
          Cell Focus
        </UButton>
        <UButton
          :color="focusMode === 'row' ? 'primary' : 'neutral'"
          :variant="focusMode === 'row' ? 'solid' : 'outline'"
          size="sm"
          @click="focusMode = 'row'"
        >
          Row Focus
        </UButton>
      </UFieldGroup>

      <span v-if="selectedCount > 0" class="text-sm text-muted">
        {{ selectedCount }} row(s) selected
      </span>
    </div>

    <NuGrid
      ref="grid"
      v-model:row-selection="rowSelection"
      v-model:column-pinning="columnPinning"
      :data="data"
      :columns="columns"
      :selection="{ mode: 'multi' }"
      :actions="{ getActions: getRowActions }"
      :editing="{ enabled: editingEnabled, startClicks: 'double' }"
      :focus="{ mode: focusMode, retain: true }"
      resize-columns
    />
  </div>
</template>
