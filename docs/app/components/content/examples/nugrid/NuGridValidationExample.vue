<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'
import { z } from 'zod'

interface User {
  id: number
  name: string
  email: string
  age: number
}

const data = ref<User[]>([
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 28 },
  { id: 2, name: 'Bob', email: 'bob@example.com', age: 35 },
  { id: 3, name: 'Carol', email: 'carol@example.com', age: 42 },
])

const userSchema = z.object({
  id: z.number(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  age: z.number().min(18, 'Must be 18 or older').max(120, 'Age must be under 120'),
})

const columns: NuGridColumn<User>[] = [
  { accessorKey: 'id', header: 'ID', size: 60, enableEditing: false },
  { accessorKey: 'name', header: 'Name', size: 150 },
  { accessorKey: 'email', header: 'Email', size: 200 },
  { accessorKey: 'age', header: 'Age', size: 80 },
]
</script>

<template>
  <div class="w-full">
    <p class="mb-3 text-sm text-muted">
      Try editing cells with invalid values (e.g., single character name, invalid email, age under
      18).
    </p>
    <NuGrid
      :data="data"
      :columns="columns"
      :editing="{ enabled: true, startClicks: 'double' }"
      :validation="{
        schema: userSchema,
        validateOn: 'submit',
        showErrors: 'always',
        onInvalid: 'block',
      }"
      :ui="{
        base: 'w-full border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50',
        th: 'py-2 border-y border-default first:border-l last:border-r first:rounded-l-lg last:rounded-r-lg',
        td: 'border-b border-default',
      }"
    />
  </div>
</template>
