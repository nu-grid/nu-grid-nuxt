<script setup lang="ts">
import type { NuGridColumn, NuGridValidationOptions } from '#nu-grid/types'
import { z } from 'zod'

interface User {
  id: number
  name: string
  email: string
  age: number
  department: string
  salary: number
}

const toast = useToast()

const data = ref<User[]>([
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    age: 28,
    department: 'Engineering',
    salary: 95000,
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    age: 35,
    department: 'Marketing',
    salary: 65000,
  },
  {
    id: 3,
    name: 'Carol Williams',
    email: 'carol@example.com',
    age: 42,
    department: 'Sales',
    salary: 80000,
  },
  {
    id: 4,
    name: 'David Brown',
    email: 'david@example.com',
    age: 31,
    department: 'Engineering',
    salary: 72000,
  },
])

// Zod schema
const userSchema = z.object({
  id: z.number(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email'),
  age: z.number().int().min(18, 'Must be 18 or older').max(120, 'Age must be at most 120'),
  department: z.string().min(1, 'Department is required'),
  salary: z.number().min(0, 'Salary must be positive'),
})

// Row-level validation
const rowRules = [
  (row: User) => {
    if (row.department === 'Engineering' && row.salary < 100000) {
      return {
        valid: false,
        message: 'Engineering employees must have salary >= $100,000',
        failedFields: ['salary'],
      }
    }
    return { valid: true }
  },
]

const validationEnabled = ref(true)
const validateOn = ref<'submit' | 'blur' | 'change' | 'reward'>('reward')
const onInvalid = ref<'block' | 'revert' | 'warn'>('block')

const validationOptions = computed<NuGridValidationOptions<User> | undefined>(() => {
  if (!validationEnabled.value) return undefined
  return {
    schema: userSchema,
    rowRules,
    validateOn: validateOn.value,
    showErrors: 'always',
    onInvalid: onInvalid.value,
  }
})

const columns: NuGridColumn<User>[] = [
  { accessorKey: 'id', header: 'ID', size: 60, enableEditing: false },
  { accessorKey: 'name', header: 'Name', size: 150 },
  { accessorKey: 'email', header: 'Email', size: 180 },
  { accessorKey: 'age', header: 'Age', size: 70 },
  { accessorKey: 'department', header: 'Department', size: 120 },
  {
    accessorKey: 'salary',
    header: 'Salary',
    size: 100,
    cell: ({ row }) => `$${row.original.salary.toLocaleString()}`,
  },
]

function onCellValueChanged(event: { row: any; column: any; oldValue: any; newValue: any }) {
  toast.add({
    title: 'Cell Updated',
    description: `${event.column.header}: "${event.oldValue}" → "${event.newValue}"`,
    color: 'success',
  })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <UButton
        :color="validationEnabled ? 'primary' : 'neutral'"
        :variant="validationEnabled ? 'solid' : 'outline'"
        size="sm"
        @click="validationEnabled = !validationEnabled"
      >
        Validation {{ validationEnabled ? 'On' : 'Off' }}
      </UButton>

      <span class="text-sm font-medium ml-2">Validate On:</span>
      <USelect
        v-model="validateOn"
        :items="[
          { label: 'Submit (Enter/Tab)', value: 'submit' },
          { label: 'Blur', value: 'blur' },
          { label: 'Change (Real-time)', value: 'change' },
          { label: 'Reward Early', value: 'reward' },
        ]"
        class="w-40"
        size="sm"
        :disabled="!validationEnabled"
      />

      <span class="text-sm font-medium ml-2">On Invalid:</span>
      <USelect
        v-model="onInvalid"
        :items="[
          { label: 'Block', value: 'block' },
          { label: 'Revert', value: 'revert' },
          { label: 'Warn', value: 'warn' },
        ]"
        class="w-28"
        size="sm"
        :disabled="!validationEnabled"
      />
    </div>

    <div class="rounded-lg border border-default p-3 bg-elevated/30 text-sm">
      <p class="font-medium mb-2">Try these to see validation:</p>
      <ul class="text-xs text-muted space-y-1">
        <li>Clear a name field (min 2 characters)</li>
        <li>Enter "invalid-email" in email field</li>
        <li>Enter age below 18 or above 120</li>
        <li><strong>Row rule:</strong> Set Engineering salary below $100k</li>
      </ul>
    </div>

    <NuGrid
      :data="data"
      :columns="columns"
      :validation="validationOptions"
      :editing="{ enabled: true, startClicks: 'double', startKeys: 'all' }"
      :focus="{ mode: 'cell' }"
      @cell-value-changed="onCellValueChanged"
    />
  </div>
</template>
