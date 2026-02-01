<script setup lang="ts">
import type { NuGridAutoSizeStrategy, NuGridColumn, NuGridResizeMode } from '#nu-grid/types'
import type { User } from '~/types'

const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')

// Autosize strategy
const autoSizeStrategy = ref<NuGridAutoSizeStrategy>('fill')

// Layout options
const fullWidthMode = ref(true)
const shiftResizeMode = ref(true)
const stickyHeadersEnabled = ref(false)

const columnVisibility = ref()
const rowSelection = ref({})
const columnSizing = ref({})
const columnPinning = ref({})

const { data } = await useFetch<User[]>('/api/customers', {
  lazy: true,
  deep: true,
})

const columns: NuGridColumn<User>[] = [
  {
    id: 'select',
    size: 50,
    minSize: 40,
    grow: false, // Fixed width - doesn't participate in flex
    enableEditing: false,
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all',
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row',
      }),
  },
  {
    accessorKey: 'id',
    header: 'ID',
    size: 80,
    minSize: 40,
    grow: false, // Fixed width - doesn't grow
    enableEditing: false,
    enableFocusing: false,
  },
  {
    accessorKey: 'name',
    header: 'Customer Name',
    minSize: 150,
    widthPercentage: 40, // Takes ~40% of remaining flex space
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          ...row.original.avatar,
          size: 'lg',
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, row.original.name),
          h('p', { class: 'text-sm text-muted' }, `@${row.original.name}`),
        ]),
      ])
    },
  },
  {
    accessorKey: 'email',
    minSize: 150,
    header: 'Email Address',
    widthPercentage: 40, // Takes ~40% of remaining flex space
  },
  {
    accessorKey: 'location',
    minSize: 100,
    header: 'Location',
    widthPercentage: 20, // Takes ~20% of remaining flex space
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    minSize: 100,
    grow: false, // Fixed width - doesn't grow
    cell: ({ row }) => {
      const color = {
        subscribed: 'success',
        unsubscribed: 'error',
        bounced: 'warning',
      }[row.original.status]

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => row.original.status)
    },
  },
]

// Computed layout options
const layoutOptions = computed(() => ({
  mode: 'div' as const,
  stickyHeaders: stickyHeadersEnabled.value,
  autoSize: autoSizeStrategy.value,
  resizeMode: (shiftResizeMode.value ? 'shift' : 'expand') as NuGridResizeMode,
}))

function triggerAutoSize() {
  if (table.value?.autoSizeColumns && autoSizeStrategy.value) {
    table.value.autoSizeColumns(autoSizeStrategy.value)
    toast.add({
      title: 'Columns Auto-sized',
      description: `Applied ${autoSizeStrategy.value} strategy`,
    })
  }
}

function resetColumnSizes() {
  columnSizing.value = {}
  toast.add({
    title: 'Column Sizes Reset',
    description: 'All columns reset to default sizes',
  })
}
</script>

<template>
  <DemoLayout id="autosizing-demo" title="AutoSizing Demo">
    <template #status>
      <DemoStatusItem label="Rows" :value="data?.length ?? 0" />
      <DemoStatusItem
        label="Selected"
        :value="`${table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0} / ${table?.tableApi?.getFilteredRowModel().rows.length || 0}`"
      />
      <DemoStatusItem label="Full Width" :value="fullWidthMode" boolean />
      <DemoStatusItem label="Resize Mode" :value="shiftResizeMode ? 'shift' : 'expand'" />
      <DemoStatusItem label="Sticky Headers" :value="stickyHeadersEnabled" boolean />
      <DemoStatusItem
        label="AutoSize Strategy"
        :value="autoSizeStrategy === false ? 'None' : autoSizeStrategy"
      />
    </template>

    <template #controls>
      <DemoControlGroup label="Layout Options">
        <UButton
          :color="fullWidthMode ? 'primary' : 'neutral'"
          :variant="fullWidthMode ? 'solid' : 'outline'"
          icon="i-lucide-expand"
          block
          @click="fullWidthMode = !fullWidthMode"
        >
          {{ fullWidthMode ? 'Normal' : 'Full' }} Width
        </UButton>

        <UButton
          :color="shiftResizeMode ? 'primary' : 'neutral'"
          :variant="shiftResizeMode ? 'solid' : 'outline'"
          icon="i-lucide-move-horizontal"
          block
          @click="shiftResizeMode = !shiftResizeMode"
        >
          Resize: {{ shiftResizeMode ? 'Shift' : 'Expand' }}
        </UButton>

        <UButton
          :color="stickyHeadersEnabled ? 'primary' : 'neutral'"
          :variant="stickyHeadersEnabled ? 'solid' : 'outline'"
          icon="i-lucide-pin"
          block
          @click="stickyHeadersEnabled = !stickyHeadersEnabled"
        >
          {{ stickyHeadersEnabled ? 'Disable' : 'Enable' }} Sticky
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="AutoSize Strategy">
        <USelect
          v-model="autoSizeStrategy"
          :items="[
            { label: 'Content Width', value: 'content' },
            { label: 'Fill Container', value: 'fill' },
            { label: 'No Autosize', value: false },
          ]"
          :ui="{
            trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
          }"
          placeholder="Autosize Mode"
          class="w-full"
        />
        <UButton
          v-if="autoSizeStrategy"
          icon="i-lucide-maximize"
          color="primary"
          variant="solid"
          block
          @click="triggerAutoSize"
        >
          Apply AutoSize
        </UButton>
        <UButton
          icon="i-lucide-rotate-ccw"
          color="neutral"
          variant="outline"
          block
          @click="resetColumnSizes"
        >
          Reset Sizes
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Column Pinning">
        <NuGridColumnPinningControl :grid-ref="table" />
      </DemoControlGroup>
    </template>

    <template #info>
      <p class="mb-3 text-sm text-muted">
        This page demonstrates the column auto-sizing feature with grow/widthPercentage controls.
      </p>
      <ul class="list-inside list-disc space-y-1 text-sm text-muted">
        <li><strong>grow: false</strong> - Select, ID, Status columns have fixed widths</li>
        <li>
          <strong>widthPercentage</strong> - Name (40%), Email (40%), Location (20%) share flex
          space
        </li>
        <li>
          <strong>Fill Container:</strong> Fixed columns stay fixed, flex columns fill remaining
          space
        </li>
        <li>
          <strong>Content Width:</strong> All columns size to content (ignores grow/percentage)
        </li>
      </ul>
    </template>

    <div :class="['h-full', fullWidthMode ? 'w-full' : '']">
      <NuGrid
        v-if="data"
        ref="table"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:column-sizing="columnSizing"
        v-model:column-pinning="columnPinning"
        :layout="layoutOptions"
        :virtualization="true"
        :column-defaults="{ resize: true, reorder: true }"
        :data="data"
        :columns="columns"
        :ui="{
          base: fullWidthMode
            ? 'w-full min-w-0 border-separate border-spacing-0'
            : 'w-max min-w-0 border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0',
        }"
      />
      <div v-else class="flex h-64 items-center justify-center text-muted">Loading...</div>
    </div>

    <template #code>
      <DemoCodeBlock
        code="<NuGrid
  :data=&quot;data&quot;
  :columns=&quot;columns&quot;
  :layout=&quot;{
    autoSize: 'fill',  // or 'content' or false
    resizeMode: 'shift'   // or 'expand'
  }&quot;
/>

// Programmatic auto-sizing
table.value.autoSizeColumns('content')
table.value.autoSizeColumns('fill')"
      />
    </template>

    <template #extra>
      <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
        <div class="text-sm text-muted">Total rows: {{ data?.length ?? 0 }}</div>
        <div class="text-sm text-muted">Selected: {{ Object.keys(rowSelection).length }}</div>
      </div>
    </template>
  </DemoLayout>
</template>

<style scoped></style>
