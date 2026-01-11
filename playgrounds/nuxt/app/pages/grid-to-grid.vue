<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'
import type { User } from '~/types'
import { toRaw } from 'vue'

const toast = useToast()
const tableLeft = useTemplateRef('tableLeft')
const tableRight = useTemplateRef('tableRight')

// Split data between two grids
const { data: allData } = await useFetch<User[]>('/api/customers', {
  lazy: true,
  deep: true,
})

const dataLeft = ref<User[]>([])
const dataRight = ref<User[]>([])

// Initialize with split data
watch(
  () => allData.value,
  (newData) => {
    if (newData && newData.length > 0) {
      const midpoint = Math.floor(newData.length / 2)
      dataLeft.value = newData.slice(0, midpoint)
      dataRight.value = newData.slice(midpoint)
    }
  },
  { immediate: true },
)

const columnFilters = ref([])
const columnVisibility = ref()
const columnSizing = ref({})

// Separate state for each grid
const rowSelectionLeft = ref({})
const rowSelectionRight = ref({})

const paginationLeft = ref({
  pageIndex: 0,
  pageSize: 10,
})

const paginationRight = ref({
  pageIndex: 0,
  pageSize: 10,
})

const rowDraggingEnabled = ref(true)

const rowDragOptionsLeft = computed(() => ({
  enabled: rowDraggingEnabled.value,
  allowCrossGrid: true,
  gridId: 'left-grid',
}))

const rowDragOptionsRight = computed(() => ({
  enabled: rowDraggingEnabled.value,
  allowCrossGrid: true,
  gridId: 'right-grid',
}))

function onRowDraggedLeft(event: any) {
  if (event.gridChanged && event.sourceGridId === 'right-grid') {
    // Row was dragged FROM right grid TO left grid
    const item = event.row as User
    if (item) {
      // Find and remove from right grid (source)
      const sourceIndex = dataRight.value.findIndex((r) => r.id === item.id)
      if (sourceIndex !== -1) {
        // Create a copy of the item to avoid reactivity issues
        const itemCopy = { ...toRaw(dataRight.value[sourceIndex]) } as User
        // Remove from source
        const newRightData = [...dataRight.value]
        newRightData.splice(sourceIndex, 1)
        dataRight.value = newRightData
        // Add to target at the drop position
        const newLeftData = [...dataLeft.value]
        newLeftData.splice(event.newIndex, 0, itemCopy)
        dataLeft.value = newLeftData
        toast.add({
          title: 'Moved to Left Grid',
          description: `${item.name} moved from right to left grid`,
        })
      }
    }
  } else if (!event.gridChanged) {
    toast.add({
      title: 'Row Reordered',
      description: `Row moved from position ${event.originalIndex} to ${event.newIndex}`,
    })
  }
}

function onRowDraggedRight(event: any) {
  if (event.gridChanged && event.sourceGridId === 'left-grid') {
    // Row was dragged FROM left grid TO right grid
    const item = event.row as User
    if (item) {
      // Find and remove from left grid (source)
      const sourceIndex = dataLeft.value.findIndex((r) => r.id === item.id)
      if (sourceIndex !== -1) {
        // Create a copy of the item to avoid reactivity issues
        const itemCopy = { ...toRaw(dataLeft.value[sourceIndex]) } as User
        // Remove from source
        const newLeftData = [...dataLeft.value]
        newLeftData.splice(sourceIndex, 1)
        dataLeft.value = newLeftData
        // Add to target at the drop position
        const newRightData = [...dataRight.value]
        newRightData.splice(event.newIndex, 0, itemCopy)
        dataRight.value = newRightData
        toast.add({
          title: 'Moved to Right Grid',
          description: `${item.name} moved from left to right grid`,
        })
      }
    }
  } else if (!event.gridChanged) {
    toast.add({
      title: 'Row Reordered',
      description: `Row moved from position ${event.originalIndex} to ${event.newIndex}`,
    })
  }
}

const UBadge = resolveComponent('UBadge')

const columns: NuGridColumn<User>[] = [
  {
    id: 'id',
    accessorKey: 'id',
    header: 'ID',
    size: 60,
    enableFocusing: false,
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
    size: 200,
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: 'Email',
    size: 250,
  },
  {
    id: 'location',
    accessorKey: 'location',
    header: 'Location',
    size: 180,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    cell: ({ row }: { row: { original: User } }) =>
      h(UBadge, {
        color:
          row.original.status === 'subscribed'
            ? 'success'
            : row.original.status === 'unsubscribed'
              ? 'error'
              : 'warning',
        label: row.original.status,
      }),
  },
]
</script>

<template>
  <UDashboardPanel id="grid-to-grid">
    <template #header>
      <UDashboardNavbar title="Grid-to-Grid Dragging Demo">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <UButton
            :color="rowDraggingEnabled ? 'primary' : 'neutral'"
            :variant="rowDraggingEnabled ? 'solid' : 'outline'"
            icon="i-lucide-grip-vertical"
            @click="rowDraggingEnabled = !rowDraggingEnabled"
          >
            {{ rowDraggingEnabled ? 'Disable' : 'Enable' }} Cross-Grid Drag
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <div class="flex flex-col gap-4 p-4">
      <div class="text-sm text-muted">
        <p class="mb-2">
          This demo shows drag-and-drop between two separate grid instances. Try dragging rows from
          one grid to the other!
        </p>
        <ul class="list-inside list-disc space-y-1">
          <li>Drag handles appear on the left when enabled</li>
          <li>Drag rows within the same grid to reorder</li>
          <li>Drag rows between grids to move them</li>
          <li>Each grid maintains its own data independently</li>
        </ul>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <!-- Left Grid -->
        <div class="flex flex-col rounded-lg border border-default">
          <div class="border-b border-default bg-elevated p-3">
            <h3 class="font-semibold">Left Grid ({{ dataLeft.length }} items)</h3>
          </div>
          <div class="h-[400px] overflow-auto">
            <NuGrid
              ref="tableLeft"
              v-model:column-filters="columnFilters"
              v-model:column-visibility="columnVisibility"
              v-model:row-selection="rowSelectionLeft"
              v-model:pagination="paginationLeft"
              v-model:column-sizing="columnSizing"
              :row-drag-options="rowDragOptionsLeft"
              :layout="{ maintainWidth: true }"
              :data="dataLeft"
              :columns="columns"
              :ui="{
                base: 'w-max min-w-full',
              }"
              @row-dragged="onRowDraggedLeft"
            >
            </NuGrid>
          </div>
        </div>

        <!-- Right Grid -->
        <div class="flex flex-col rounded-lg border border-default">
          <div class="border-b border-default bg-elevated p-3">
            <h3 class="font-semibold">Right Grid ({{ dataRight.length }} items)</h3>
          </div>
          <div class="h-[400px] overflow-auto">
            <NuGrid
              ref="tableRight"
              v-model:column-filters="columnFilters"
              v-model:column-visibility="columnVisibility"
              v-model:row-selection="rowSelectionRight"
              v-model:pagination="paginationRight"
              v-model:column-sizing="columnSizing"
              :row-drag-options="rowDragOptionsRight"
              :layout="{ maintainWidth: true }"
              :data="dataRight"
              :columns="columns"
              :ui="{
                base: 'w-max min-w-full',
              }"
              @row-dragged="onRowDraggedRight"
            >
            </NuGrid>
          </div>
        </div>
      </div>
    </div>
  </UDashboardPanel>
</template>
