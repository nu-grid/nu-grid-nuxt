<script setup lang="ts">
import type { NuGridAutoSizeStrategy, NuGridColumn } from '#nu-grid/types'
import type { User } from '~/types'

const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')

// Autosize strategy
const autoSizeStrategy = ref<NuGridAutoSizeStrategy>('fitGrid')

// Layout options
const fullWidthMode = ref(false)
const maintainTableWidth = ref(true)
const stickyHeadersEnabled = ref(false)

const columnVisibility = ref()
const rowSelection = ref({})
const columnSizing = ref({})
const columnPinning = ref({})

const { data, status } = await useFetch<User[]>('/api/customers', {
  lazy: true,
  deep: true,
})

const columns: NuGridColumn<User>[] = [
  {
    id: 'select',
    minSize: 40,
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
    minSize: 40,
    enableEditing: false,
    enableFocusing: false,
  },
  {
    accessorKey: 'name',
    header: 'Customer Name',
    minSize: 40,
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
    minSize: 40,
    header: 'Email Address',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    minSize: 100,
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
  maintainWidth: maintainTableWidth.value,
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
      <DemoStatusItem label="Maintain Width" :value="maintainTableWidth" boolean />
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
          :color="maintainTableWidth ? 'primary' : 'neutral'"
          :variant="maintainTableWidth ? 'solid' : 'outline'"
          icon="i-lucide-move-horizontal"
          block
          @click="maintainTableWidth = !maintainTableWidth"
        >
          {{ maintainTableWidth ? 'Maintain' : 'Auto' }} Width
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
            { label: 'Fit Cell Contents', value: 'fitCell' },
            { label: 'Fit Grid Width', value: 'fitGrid' },
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
        This page demonstrates the column auto-sizing feature with a simplified table. Try different
        strategies to see how columns adapt to content or fill available space.
      </p>
      <ul class="list-inside list-disc space-y-1 text-sm text-muted">
        <li>
          <strong>Full Width:</strong> Toggle to make the table expand to full container width
        </li>
        <li>
          <strong>Maintain Width:</strong> When enabled, table maintains its width during column
          resizing
        </li>
        <li><strong>Fit Cell Contents:</strong> Sizes columns based on actual content width</li>
        <li>
          <strong>Fit Grid Width:</strong> Sizes based on content and scales to fill container
        </li>
        <li><strong>Manual Resize:</strong> Drag column borders to manually adjust sizes</li>
      </ul>
    </template>

    <div :class="fullWidthMode ? 'w-full' : ''">
      <NuGrid
        ref="table"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:column-sizing="columnSizing"
        v-model:column-pinning="columnPinning"
        :layout="layoutOptions"
        :column-defaults="{ resize: true, reorder: true }"
        :data="data"
        :columns="columns"
        :loading="status === 'pending'"
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
    </div>

    <template #code>
      <DemoCodeBlock
        code="<NuGrid
  :data=&quot;data&quot;
  :columns=&quot;columns&quot;
  :layout=&quot;{
    autoSize: 'fitGrid',  // or 'fitCell' or false
    maintainWidth: true
  }&quot;
/>

// Programmatic auto-sizing
table.value.autoSizeColumns('fitCell')
table.value.autoSizeColumns('fitGrid')"
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
