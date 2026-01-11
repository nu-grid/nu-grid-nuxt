<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'
import { z } from 'zod'

// Sample data for the demo
interface User {
  id: number
  name: string
  email: string
  age: number
  department: string
  salary: number
}

const data = ref<User[]>([
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    age: 28,
    department: 'Engineering',
    salary: 75000,
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
  {
    id: 5,
    name: 'Eva Martinez',
    email: 'eva@example.com',
    age: 26,
    department: 'Design',
    salary: 68000,
  },
])

// Create a validation schema using Zod
// Zod 4.x automatically implements Standard Schema v1 via the `~standard` property
const userSchema = z.object({
  id: z.number().min(1, 'ID must be a positive number'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  email: z.email('Please enter a valid email address'),
  age: z
    .number()
    .int('Age must be a whole number')
    .min(18, 'Age must be at least 18')
    .max(120, 'Age must be at most 120'),
  department: z.string().min(1, 'Department is required'),
  salary: z.number().min(0, 'Salary must be a positive number'),
})

// Row-level validation rules
// These check relationships between fields in a row
const rowRules = [
  // Engineering department must have salary >= $100,000
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

// Toggle validation on/off for demonstration
const validationEnabled = ref(true)

// When to validate option
type ValidateOn = 'submit' | 'blur' | 'change' | 'reward'
const validateOn = ref<ValidateOn>('reward')
const validateOnOptions = [
  { label: 'On Submit (Enter/Tab)', value: 'submit' as ValidateOn },
  { label: 'On Blur', value: 'blur' as ValidateOn },
  { label: 'On Change (Real-time)', value: 'change' as ValidateOn },
  { label: 'Reward Early, Punish Late', value: 'reward' as ValidateOn },
]

// Show errors option
type ShowErrors = 'never' | 'hover' | 'always'
const showErrors = ref<ShowErrors>('always')
const showErrorsOptions = [
  { label: 'Show on Hover', value: 'hover' as ShowErrors },
  { label: 'Show Always', value: 'always' as ShowErrors },
  { label: 'Never Show', value: 'never' as ShowErrors },
]

// Error icon option
const errorIcon = ref('i-lucide-alert-circle')
const errorIconOptions = [
  { label: 'Alert Circle', value: 'i-lucide-alert-circle' },
  { label: 'Alert Octagon', value: 'i-lucide-alert-octagon' },
  { label: 'Shield Alert', value: 'i-lucide-shield-alert' },
]

// On invalid option
type OnInvalid = 'block' | 'revert' | 'warn'
const onInvalid = ref<OnInvalid>('block')
const onInvalidOptions = [
  { label: 'Block (stay in editor)', value: 'block' as OnInvalid },
  { label: 'Revert (restore original)', value: 'revert' as OnInvalid },
  { label: 'Warn (allow navigation)', value: 'warn' as OnInvalid },
]

// Computed validation schema with options
const validationSchemaWithOptions = computed(() => {
  if (!validationEnabled.value) return undefined
  return {
    schema: userSchema,
    rowRules,
    validateOn: validateOn.value,
    showErrors: showErrors.value,
    icon: errorIcon.value,
    onInvalid: onInvalid.value,
  }
})

// Track validation events for the log
interface ValidationEvent {
  timestamp: Date
  field: string
  value: any
  result: 'valid' | 'invalid'
  message?: string
}
const validationLog = ref<ValidationEvent[]>([])

// Handle cell change events
function handleCellChange(payload: { row: any; column: any; oldValue: any; newValue: any }) {
  const event: ValidationEvent = {
    timestamp: new Date(),
    field: payload.column.id,
    value: payload.newValue,
    result: 'valid',
  }
  validationLog.value.unshift(event)
  // Keep only last 10 events
  if (validationLog.value.length > 10) {
    validationLog.value.pop()
  }
}

// Define columns
const columns: NuGridColumn<User>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    minSize: 60,
    size: 60,
    enableEditing: false,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    minSize: 150,
    size: 180,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    minSize: 180,
    size: 220,
  },
  {
    accessorKey: 'age',
    header: 'Age',
    minSize: 70,
    size: 80,
  },
  {
    accessorKey: 'department',
    header: 'Department',
    minSize: 120,
    size: 140,
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    minSize: 100,
    size: 120,
    cell: ({ row }) => {
      const salary = row.original.salary
      return typeof salary === 'number' ? `$${salary.toLocaleString()}` : salary
    },
  },
]
</script>

<template>
  <DemoLayout id="validation-zod-demo" title="Validation Demo (Zod)" sidebar-width="320px">
    <template #status>
      <DemoStatusItem label="Validation" :value="validationEnabled" boolean />
      <DemoStatusItem label="Validate On" :value="validateOn" />
      <DemoStatusItem label="Show Errors" :value="showErrors" />
      <DemoStatusItem label="On Invalid" :value="onInvalid" />
      <DemoStatusItem label="Recent Edits" :value="validationLog.length" />
    </template>

    <template #controls>
      <DemoControlGroup label="Validation Toggle">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm">Enable Validation</span>
          <USwitch v-model="validationEnabled" />
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Validate On">
        <USelect
          v-model="validateOn"
          :items="validateOnOptions"
          :disabled="!validationEnabled"
          class="w-full"
        />
      </DemoControlGroup>

      <DemoControlGroup label="Show Errors">
        <USelect
          v-model="showErrors"
          :items="showErrorsOptions"
          :disabled="!validationEnabled"
          class="w-full"
        />
      </DemoControlGroup>

      <DemoControlGroup label="Error Icon">
        <USelect
          v-model="errorIcon"
          :items="errorIconOptions"
          :disabled="!validationEnabled"
          class="w-full"
        />
      </DemoControlGroup>

      <DemoControlGroup label="On Invalid">
        <USelect
          v-model="onInvalid"
          :items="onInvalidOptions"
          :disabled="!validationEnabled"
          class="w-full"
        />
        <p class="mt-1 text-xs text-muted">
          Block keeps editor open; Revert restores original; Warn allows navigation
        </p>
      </DemoControlGroup>

      <DemoControlGroup label="Try These Examples">
        <ul class="space-y-2 text-xs text-muted">
          <li class="flex items-start gap-2">
            <UIcon name="i-lucide-x-circle" class="mt-0.5 size-3.5 shrink-0 text-error" />
            <span>Clear a name field (required)</span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon name="i-lucide-x-circle" class="mt-0.5 size-3.5 shrink-0 text-error" />
            <span>Enter "invalid-email" in email</span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon name="i-lucide-x-circle" class="mt-0.5 size-3.5 shrink-0 text-error" />
            <span>Enter age below 18 or above 120</span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon name="i-lucide-alert-triangle" class="mt-0.5 size-3.5 shrink-0 text-warning" />
            <span><strong>Row rule:</strong> Set Engineering salary &lt; $100k</span>
          </li>
        </ul>
      </DemoControlGroup>

      <DemoControlGroup label="Recent Edits">
        <div v-if="validationLog.length === 0" class="text-xs text-muted">
          Edit a cell to see validation events
        </div>
        <ul v-else class="max-h-32 space-y-2 overflow-auto">
          <li
            v-for="(event, index) in validationLog"
            :key="index"
            class="flex items-start gap-2 text-xs"
          >
            <UIcon
              :name="event.result === 'valid' ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
              :class="[
                'mt-0.5 size-3.5 shrink-0',
                event.result === 'valid' ? 'text-success' : 'text-error',
              ]"
            />
            <div class="min-w-0 flex-1 truncate">
              <span class="font-medium">{{ event.field }}</span>
              <span class="text-muted"> → {{ event.value }}</span>
            </div>
          </li>
        </ul>
        <UButton
          v-if="validationLog.length > 0"
          size="xs"
          color="neutral"
          variant="ghost"
          block
          @click="validationLog = []"
        >
          Clear Log
        </UButton>
      </DemoControlGroup>
    </template>

    <template #info>
      <p class="mb-3 text-sm text-muted">
        This page demonstrates the
        <code class="rounded bg-default px-1 py-0.5 text-xs">validationSchema</code>
        prop for NuGrid using
        <a href="https://zod.dev" target="_blank" class="text-primary hover:underline">Zod</a>. Zod
        implements the
        <a href="https://standardschema.dev" target="_blank" class="text-primary hover:underline"
          >Standard Schema v1</a
        >
        specification natively.
      </p>
      <ul class="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
        <li><strong>Zod validation:</strong> Uses Zod's native Standard Schema support</li>
        <li>
          <strong>Error display:</strong> Shows validation errors in a popover with error styling
        </li>
        <li><strong>Stay in edit mode:</strong> Invalid edits keep the cell in edit mode</li>
        <li><strong>Type-safe:</strong> Zod provides full TypeScript inference</li>
      </ul>
      <div class="mb-3 rounded-lg border border-default/50 bg-elevated/30 p-3">
        <p class="mb-2 text-sm font-semibold">Cell Validation Rules:</p>
        <ul class="space-y-1 text-xs text-muted">
          <li>
            <code class="rounded bg-default px-1 py-0.5">name</code> - Required, 2-50 characters
          </li>
          <li><code class="rounded bg-default px-1 py-0.5">email</code> - Valid email format</li>
          <li><code class="rounded bg-default px-1 py-0.5">age</code> - Integer between 18-120</li>
          <li><code class="rounded bg-default px-1 py-0.5">department</code> - Required</li>
          <li><code class="rounded bg-default px-1 py-0.5">salary</code> - Non-negative number</li>
        </ul>
      </div>
      <div class="rounded-lg border border-error/30 bg-error/5 p-3">
        <p class="mb-2 text-sm font-semibold text-error">Row Validation Rules:</p>
        <ul class="space-y-1 text-xs text-muted">
          <li class="flex items-start gap-2">
            <UIcon name="i-lucide-alert-triangle" class="mt-0.5 size-3.5 shrink-0 text-error" />
            <span>
              <strong>Engineering</strong> employees must have salary
              <code class="rounded bg-default px-1 py-0.5">&gt;= $100,000</code>
            </span>
          </li>
        </ul>
      </div>
    </template>

    <NuGrid
      :data="data"
      :columns="columns"
      :validation="validationSchemaWithOptions"
      :focus="{ retain: true }"
      :editing="{ enabled: true, startClicks: 'single', startKeys: 'all' }"
      resize-columns
      :ui="{
        base: 'w-max min-w-full border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default',
      }"
      @cell-change="handleCellChange"
    />

    <template #code>
      <DemoCodeBlock
        code="import { z } from 'zod'

const userSchema = z.object({
  id: z.number().min(1),
  name: z.string().min(2).max(50),
  email: z.email(),
  age: z.number().int().min(18).max(120),
  department: z.string().min(1),
  salary: z.number().min(0)
})

// Row validation rules
const rowRules = [
  (row) => {
    if (row.department === 'Engineering'
        && row.salary < 100000) {
      return {
        valid: false,
        message: 'Engineering salary >= $100k',
        failedFields: ['salary']
      }
    }
    return { valid: true }
  }
]

<NuGrid
  :data=&quot;data&quot;
  :columns=&quot;columns&quot;
  :validation=&quot;{
    schema: userSchema,
    rowRules,
    validateOn: 'reward',
    showErrors: 'always',
    onInvalid: 'block'
  }&quot;
/>"
      />
    </template>
  </DemoLayout>
</template>

<style scoped>
code {
  font-family: 'Monaco', 'Courier New', monospace;
}

pre {
  font-family: 'Monaco', 'Courier New', monospace;
}
</style>
