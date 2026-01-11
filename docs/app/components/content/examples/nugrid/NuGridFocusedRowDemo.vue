<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface Employee {
  id: number
  name: string
  email: string
  department: string
}

const departments = ['Engineering', 'Marketing', 'HR', 'Sales', 'Finance']
const firstNames = ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry']
const lastNames = ['Johnson', 'Smith', 'White', 'Brown', 'Davis', 'Wilson']

const data = ref<Employee[]>(
  Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    email: `user${i + 1}@example.com`,
    department: departments[i % departments.length]!,
  })),
)

const columns: NuGridColumn<Employee>[] = [
  { accessorKey: 'id', header: 'ID', size: 60 },
  { accessorKey: 'name', header: 'Name', size: 150 },
  { accessorKey: 'email', header: 'Email', size: 200 },
  { accessorKey: 'department', header: 'Department', size: 120 },
]

const focusedRowId = ref<string | null>(null)
const gridRef = useTemplateRef<{
  focusRowById: (id: string, options?: { align?: 'nearest' | 'top' | 'center' }) => void
}>('grid')

const scrollAlign = ref<'nearest' | 'top' | 'center'>('nearest')

const focusedRowDisplay = computed(() => {
  if (!focusedRowId.value) return 'None'
  const row = data.value.find((r) => String(r.id) === focusedRowId.value)
  return row ? `${row.name} (ID: ${row.id})` : focusedRowId.value
})

function focusFirst() {
  gridRef.value?.focusRowById('1', { align: scrollAlign.value })
}

function focusMiddle() {
  const middleId = String(Math.floor(data.value.length / 2))
  gridRef.value?.focusRowById(middleId, { align: scrollAlign.value })
}

function focusLast() {
  const lastId = String(data.value[data.value.length - 1]?.id)
  gridRef.value?.focusRowById(lastId, { align: scrollAlign.value })
}

function focusRandom() {
  const randomIndex = Math.floor(Math.random() * data.value.length)
  const randomId = String(data.value[randomIndex]?.id)
  gridRef.value?.focusRowById(randomId, { align: scrollAlign.value })
}

function clearFocus() {
  focusedRowId.value = null
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <UButton size="sm" @click="focusFirst">First</UButton>
      <UButton size="sm" @click="focusMiddle">Middle</UButton>
      <UButton size="sm" @click="focusLast">Last</UButton>
      <UButton size="sm" variant="outline" @click="focusRandom">Random</UButton>
      <UButton size="sm" variant="outline" color="warning" @click="clearFocus">Clear</UButton>

      <span class="text-sm font-medium ml-2">Scroll:</span>
      <UFieldGroup>
        <UButton
          v-for="align in ['nearest', 'top', 'center'] as const"
          :key="align"
          :color="scrollAlign === align ? 'primary' : 'neutral'"
          :variant="scrollAlign === align ? 'solid' : 'outline'"
          size="sm"
          @click="scrollAlign = align"
        >
          {{ align }}
        </UButton>
      </UFieldGroup>
    </div>

    <div class="rounded-lg border border-default p-3 bg-elevated/30 text-sm">
      <p><strong>Focused:</strong> {{ focusedRowDisplay }}</p>
      <p class="text-xs text-muted mt-1">
        Click buttons to focus rows programmatically with different scroll alignments
      </p>
    </div>

    <div class="h-64 overflow-hidden rounded-lg border border-default">
      <NuGrid
        ref="grid"
        v-model:focused-row-id="focusedRowId"
        :data="data"
        :columns="columns"
        :focus="{ mode: 'cell', alignOnModel: 'top' }"
        :layout="{ stickyHeaders: true }"
      />
    </div>
  </div>
</template>
