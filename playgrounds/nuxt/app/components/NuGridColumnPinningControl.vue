<script setup lang="ts">
import { computed, resolveComponent } from 'vue'

/**
 * Props for NuGridColumnPinningControl
 * Uses the NuGrid component ref to access column pinning methods exposed via defineExpose
 */
const props = defineProps<{
  /** Reference to the NuGrid component (via template ref) */
  gridRef: {
    tableApi: any
    pinColumn: (columnId: string, side: 'left' | 'right') => void
    unpinColumn: (columnId: string) => void
    isPinned: (columnId: string) => 'left' | 'right' | false
    getPinnedColumns: () => { left: string[]; right: string[] }
  } | null
}>()

const UDropdownMenu = resolveComponent('UDropdownMenu')
const UButton = resolveComponent('UButton')

// Get pinnable columns (all leaf columns except select and actions which are pinned by default)
const pinnableColumns = computed(() => {
  if (!props.gridRef?.tableApi) return []
  return props.gridRef.tableApi
    .getAllLeafColumns()
    .filter((col: any) => col.id !== 'select' && col.id !== 'actions')
    .map((col: any) => ({
      id: col.id,
      label: typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id,
    }))
})
</script>

<template>
  <UDropdownMenu
    v-if="pinnableColumns.length > 0 && gridRef"
    :items="
      pinnableColumns.map((col: any) => {
        const pinned = gridRef!.isPinned(col.id)
        return {
          label: col.label,
          icon:
            pinned === 'left'
              ? 'i-lucide-pin'
              : pinned === 'right'
                ? 'i-lucide-pin'
                : 'i-lucide-pin-off',
          children: [
            {
              label: 'Pin Left',
              icon: 'i-lucide-arrow-left-to-line',
              onSelect: () => gridRef!.pinColumn(col.id, 'left'),
            },
            {
              label: 'Pin Right',
              icon: 'i-lucide-arrow-right-to-line',
              onSelect: () => gridRef!.pinColumn(col.id, 'right'),
            },
            {
              label: 'Unpin',
              icon: 'i-lucide-pin-off',
              disabled: !pinned,
              onSelect: () => gridRef!.unpinColumn(col.id),
            },
          ],
        }
      })
    "
    :content="{ align: 'end' }"
  >
    <UButton label="Pin Columns" color="neutral" variant="outline" trailing-icon="i-lucide-pin" />
  </UDropdownMenu>
</template>
