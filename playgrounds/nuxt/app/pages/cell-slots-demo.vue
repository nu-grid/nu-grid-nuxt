<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface User {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  avatar: string
  lastLogin: string
}

const data = ref<User[]>([
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'Admin',
    status: 'active',
    avatar: 'https://i.pravatar.cc/32?u=alice',
    lastLogin: '2024-01-15',
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'Editor',
    status: 'inactive',
    avatar: 'https://i.pravatar.cc/32?u=bob',
    lastLogin: '2024-01-10',
  },
  {
    id: 3,
    name: 'Carol White',
    email: 'carol@example.com',
    role: 'Viewer',
    status: 'pending',
    avatar: 'https://i.pravatar.cc/32?u=carol',
    lastLogin: '2024-01-14',
  },
  {
    id: 4,
    name: 'David Brown',
    email: 'david@example.com',
    role: 'Editor',
    status: 'active',
    avatar: 'https://i.pravatar.cc/32?u=david',
    lastLogin: '2024-01-15',
  },
  {
    id: 5,
    name: 'Eve Wilson',
    email: 'eve@example.com',
    role: 'Admin',
    status: 'active',
    avatar: 'https://i.pravatar.cc/32?u=eve',
    lastLogin: '2024-01-13',
  },
  {
    id: 6,
    name: 'Frank Miller',
    email: 'frank@example.com',
    role: 'Viewer',
    status: 'inactive',
    avatar: 'https://i.pravatar.cc/32?u=frank',
    lastLogin: '2024-01-08',
  },
])

const editingEnabled = ref(true)
const { focusMode, toggleFocusMode, focusModeIcon, focusModeLabel, focusModeStatus } =
  useFocusModeToggle()

const columns: NuGridColumn<User>[] = [
  { accessorKey: 'id', header: 'ID', size: 60, enableEditing: false },
  { accessorKey: 'name', header: 'Name', size: 180 },
  { accessorKey: 'email', header: 'Email', size: 200 },
  { accessorKey: 'role', header: 'Role', size: 100 },
  { accessorKey: 'status', header: 'Status', size: 120 },
  { accessorKey: 'lastLogin', header: 'Last Login', size: 120, cellDataType: 'date' },
]

const statusColors: Record<string, 'success' | 'error' | 'warning'> = {
  active: 'success',
  inactive: 'error',
  pending: 'warning',
}

const roleIcons: Record<string, string> = {
  Admin: 'i-lucide-shield',
  Editor: 'i-lucide-pencil',
  Viewer: 'i-lucide-eye',
}
</script>

<template>
  <DemoLayout id="cell-slots-demo" title="Cell Template Slots Demo">
    <template #status>
      <DemoStatusItem label="Users" :value="data.length" />
      <DemoStatusItem label="Editing" :value="editingEnabled" boolean />
      <DemoStatusItem label="Focus Mode" :value="focusModeLabel" />
    </template>

    <template #controls>
      <DemoControlGroup label="Options">
        <UButton
          :color="editingEnabled ? 'success' : 'neutral'"
          :variant="editingEnabled ? 'solid' : 'outline'"
          :icon="editingEnabled ? 'i-lucide-pencil' : 'i-lucide-pencil-off'"
          block
          @click="editingEnabled = !editingEnabled"
        >
          {{ editingEnabled ? 'Disable' : 'Enable' }} Editing
        </UButton>

        <UButton
          color="neutral"
          variant="outline"
          :icon="focusModeIcon"
          :aria-label="focusModeStatus"
          block
          @click="toggleFocusMode"
        >
          Focus: {{ focusModeLabel }}
        </UButton>
      </DemoControlGroup>
    </template>

    <template #info>
      <p class="mb-3 text-sm text-muted">
        This demo shows how to use <strong>cell template slots</strong> as an alternative to render
        functions. Slots allow you to use Vue template syntax with directives and Nuxt UI
        components.
      </p>
      <ul class="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
        <li><strong>#name-cell:</strong> Avatar + name with flexbox layout</li>
        <li><strong>#role-cell:</strong> Icon + role text</li>
        <li><strong>#status-cell:</strong> UBadge with dynamic color</li>
      </ul>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Editing works seamlessly:</strong> Double-click any editable cell to see the editor.
        The slot content is replaced by the editor during edit mode.
      </div>
    </template>

    <NuGrid
      :editing="{
        enabled: editingEnabled,
        startClicks: 'double',
      }"
      :focus="{ mode: focusMode }"
      :layout="{ mode: 'div', stickyHeaders: true }"
      :data="data"
      :columns="columns"
      :ui="{
        base: 'w-max min-w-full border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default',
        separator: 'h-0',
      }"
    >
      <!-- Name cell with avatar -->
      <template #name-cell="{ value, row }">
        <div class="flex items-center gap-2">
          <UAvatar :src="row.original.avatar" size="2xs" />
          <span>{{ value }}</span>
        </div>
      </template>

      <!-- Role cell with icon -->
      <template #role-cell="{ value }">
        <div class="flex items-center gap-1.5">
          <UIcon :name="roleIcons[value as string]" class="size-4 text-muted" />
          <span>{{ value }}</span>
        </div>
      </template>

      <!-- Status cell with badge -->
      <template #status-cell="{ value }">
        <UBadge :color="statusColors[value as string]" variant="subtle" size="sm">
          {{ value }}
        </UBadge>
      </template>
    </NuGrid>

    <template #code>
      <DemoCodeBlock
        code="<NuGrid :columns='columns' :data='data'>
  <!-- Name cell with avatar -->
  <template #name-cell='{ value, row }'>
    <div class='flex items-center gap-2'>
      <UAvatar :src='row.original.avatar' size='2xs' />
      <span>{{ value }}</span>
    </div>
  </template>

  <!-- Status cell with badge -->
  <template #status-cell='{ value }'>
    <UBadge :color='statusColors[value]' variant='subtle'>
      {{ value }}
    </UBadge>
  </template>
</NuGrid>"
      />
    </template>

    <template #extra>
      <UAccordion
        :items="[{ label: 'Slot Props Reference', icon: 'i-lucide-book-open', slot: 'reference' }]"
      >
        <template #reference>
          <div class="p-4">
            <div class="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
              <div>
                <div class="mb-1 rounded bg-default/50 p-2 font-mono">value</div>
                <p class="text-muted">The cell value (shortcut for cell.getValue())</p>
              </div>
              <div>
                <div class="mb-1 rounded bg-default/50 p-2 font-mono">row</div>
                <p class="text-muted">TanStack Row object with original data</p>
              </div>
              <div>
                <div class="mb-1 rounded bg-default/50 p-2 font-mono">cell</div>
                <p class="text-muted">TanStack Cell object</p>
              </div>
              <div>
                <div class="mb-1 rounded bg-default/50 p-2 font-mono">column</div>
                <p class="text-muted">TanStack Column definition</p>
              </div>
              <div>
                <div class="mb-1 rounded bg-default/50 p-2 font-mono">isEditing</div>
                <p class="text-muted">Whether the cell is in edit mode</p>
              </div>
              <div>
                <div class="mb-1 rounded bg-default/50 p-2 font-mono">isInvalid</div>
                <p class="text-muted">Whether the cell has a validation error</p>
              </div>
            </div>
          </div>
        </template>
      </UAccordion>
    </template>
  </DemoLayout>
</template>
