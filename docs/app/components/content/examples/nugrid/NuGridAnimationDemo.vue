<script setup lang="ts">
import type { NuGridAnimationOptions, NuGridColumn } from '#nu-grid/types'

interface Task {
  id: number
  name: string
  status: 'pending' | 'in-progress' | 'completed'
  priority: number
}

const statuses: Task['status'][] = ['pending', 'in-progress', 'completed']

function generateTasks(count: number): Task[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Task ${i + 1}`,
    status: statuses[i % statuses.length]!,
    priority: i + 1,
  }))
}

const initialData = generateTasks(20)
const data = ref<Task[]>([...initialData])

const animationEnabled = ref(true)
const animationDuration = ref(300)

const animationOptions = computed<NuGridAnimationOptions | false>(() => {
  if (!animationEnabled.value) return false
  return {
    enabled: true,
    duration: animationDuration.value,
    easing: 'ease-out',
  }
})

const statusColors: Record<string, string> = {
  'pending': 'text-warning',
  'in-progress': 'text-info',
  'completed': 'text-success',
}

const columns: NuGridColumn<Task>[] = [
  { accessorKey: 'id', header: 'ID', size: 60 },
  { accessorKey: 'name', header: 'Task Name', size: 150 },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 100,
    cell: ({ row }) =>
      h(
        'span',
        { class: `capitalize ${statusColors[row.original.status]}` },
        row.original.status.replace('-', ' '),
      ),
  },
  { accessorKey: 'priority', header: 'Priority', size: 80 },
]

function shuffleRows() {
  const shuffled = [...data.value]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]!
    shuffled[i] = shuffled[j]!
    shuffled[j] = temp
  }
  data.value = shuffled
}

function sortByPriority() {
  data.value = [...data.value].sort((a, b) => a.priority - b.priority)
}

function reverseRows() {
  data.value = [...data.value].reverse()
}

function addRow() {
  const newId = Math.max(...data.value.map((d) => d.id)) + 1
  data.value = [
    ...data.value,
    {
      id: newId,
      name: `Task ${newId}`,
      status: statuses[Math.floor(Math.random() * statuses.length)]!,
      priority: newId,
    },
  ]
}

function removeLastRow() {
  if (data.value.length > 0) {
    data.value = data.value.slice(0, -1)
  }
}

function resetData() {
  data.value = [...initialData]
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <UButton
        :color="animationEnabled ? 'primary' : 'neutral'"
        :variant="animationEnabled ? 'solid' : 'outline'"
        size="sm"
        @click="animationEnabled = !animationEnabled"
      >
        Animation {{ animationEnabled ? 'On' : 'Off' }}
      </UButton>

      <span v-if="animationEnabled" class="text-sm font-medium">Duration:</span>
      <UFieldGroup v-if="animationEnabled">
        <UButton
          v-for="dur in [150, 300, 500]"
          :key="dur"
          :color="animationDuration === dur ? 'primary' : 'neutral'"
          :variant="animationDuration === dur ? 'solid' : 'outline'"
          size="sm"
          @click="animationDuration = dur"
        >
          {{ dur }}ms
        </UButton>
      </UFieldGroup>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <UButton size="sm" variant="outline" @click="shuffleRows">Shuffle</UButton>
      <UButton size="sm" variant="outline" @click="sortByPriority">Sort</UButton>
      <UButton size="sm" variant="outline" @click="reverseRows">Reverse</UButton>
      <UButton size="sm" variant="outline" color="success" @click="addRow">Add Row</UButton>
      <UButton size="sm" variant="outline" color="warning" @click="removeLastRow">Remove</UButton>
      <UButton size="sm" variant="outline" @click="resetData">Reset</UButton>
    </div>

    <div class="rounded-lg border border-default p-3 bg-elevated/30 text-sm">
      <p>
        <strong>{{ data.length }}</strong> rows | Animation:
        <strong>{{ animationEnabled ? `${animationDuration}ms` : 'Disabled' }}</strong>
      </p>
      <p class="text-xs text-muted mt-1">
        Click Shuffle or Sort to see rows animate into new positions
      </p>
    </div>

    <NuGrid
      :data="data"
      :columns="columns"
      :animation="animationOptions"
      :focus="{ mode: 'cell', retain: true }"
    />
  </div>
</template>
