<script setup lang="ts">
import NuGridSelectMenu from '#nu-grid/components/NuGridSelectMenu.vue'

// Simple items for testing
const statusItems = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'archived', label: 'Archived' },
]

const categoryItems = [
  { value: 'electronics', label: 'Electronics', description: 'Phones, computers, gadgets' },
  { value: 'furniture', label: 'Furniture', description: 'Tables, chairs, desks' },
  { value: 'clothing', label: 'Clothing', description: 'Shirts, pants, accessories' },
  { value: 'books', label: 'Books', description: 'Fiction, non-fiction, textbooks' },
]

const priorityItems = [
  { value: 'low', label: 'Low Priority', icon: 'i-lucide-arrow-down' },
  { value: 'medium', label: 'Medium Priority', icon: 'i-lucide-minus' },
  { value: 'high', label: 'High Priority', icon: 'i-lucide-arrow-up' },
]

// Reactive values
const selectedStatus = ref('active')
const selectedCategory = ref('electronics')
const selectedPriority = ref('medium')
const selectedMultiple = ref(['active', 'pending'])

// For comparison - standard USelectMenu
const standardStatus = ref('active')

// Text inputs for testing tab navigation
const textBefore = ref('')
const textBetween1 = ref('')
const textBetween2 = ref('')
const textAfter = ref('')
</script>

<template>
  <div class="container mx-auto max-w-4xl p-8">
    <h1 class="mb-8 text-2xl font-bold">NuGridSelectMenu Demo</h1>

    <p class="mb-6 text-muted">
      Testing custom NuGridSelectMenu component (local copy of Nuxt UI's SelectMenu).
    </p>

    <div class="space-y-8">
      <!-- Text input before dropdowns -->
      <div class="rounded-lg border p-4">
        <h2 class="mb-4 text-lg font-semibold">Text Input (Before)</h2>
        <div class="w-64">
          <UInput v-model="textBefore" placeholder="Tab navigation test..." />
        </div>
      </div>

      <!-- Basic Select -->
      <div class="rounded-lg border p-4">
        <h2 class="mb-4 text-lg font-semibold">Basic Select</h2>
        <div class="flex items-center gap-4">
          <div class="w-48">
            <label class="mb-1 block text-sm text-muted">NuGridSelectMenu:</label>
            <NuGridSelectMenu
              v-model="selectedStatus"
              :items="statusItems"
              value-key="value"
              label-key="label"
              placeholder="Select status..."
              close-on-tab
            />
          </div>
          <div class="w-48">
            <label class="mb-1 block text-sm text-muted">Standard USelectMenu:</label>
            <USelectMenu
              v-model="standardStatus"
              :items="statusItems"
              value-key="value"
              label-key="label"
              placeholder="Select status..."
            />
          </div>
          <div class="text-sm">
            <div>NuGrid value: <code class="rounded bg-default px-1">{{ selectedStatus }}</code></div>
            <div>Standard value: <code class="rounded bg-default px-1">{{ standardStatus }}</code></div>
          </div>
        </div>
      </div>

      <!-- Text input between sections -->
      <div class="rounded-lg border p-4">
        <h2 class="mb-4 text-lg font-semibold">Text Input (Between 1)</h2>
        <div class="w-64">
          <UInput v-model="textBetween1" placeholder="Tab navigation test..." />
        </div>
      </div>

      <!-- With Descriptions -->
      <div class="rounded-lg border p-4">
        <h2 class="mb-4 text-lg font-semibold">With Descriptions</h2>
        <div class="flex items-center gap-4">
          <div class="w-64">
            <NuGridSelectMenu
              v-model="selectedCategory"
              :items="categoryItems"
              value-key="value"
              label-key="label"
              description-key="description"
              placeholder="Select category..."
              close-on-tab
              open-on-focus
            />
          </div>
          <div class="text-sm">
            Selected: <code class="rounded bg-default px-1">{{ selectedCategory }}</code>
          </div>
        </div>
      </div>

      <!-- With Icons -->
      <div class="rounded-lg border p-4">
        <h2 class="mb-4 text-lg font-semibold">With Icons</h2>
        <div class="flex items-center gap-4">
          <div class="w-48">
            <NuGridSelectMenu
              v-model="selectedPriority"
              :items="priorityItems"
              value-key="value"
              label-key="label"
              placeholder="Select priority..."
              close-on-tab
              open-on-focus
            />
          </div>
          <div class="text-sm">
            Selected: <code class="rounded bg-default px-1">{{ selectedPriority }}</code>
          </div>
        </div>
      </div>

      <!-- Text input between sections -->
      <div class="rounded-lg border p-4">
        <h2 class="mb-4 text-lg font-semibold">Text Input (Between 2)</h2>
        <div class="w-64">
          <UInput v-model="textBetween2" placeholder="Tab navigation test..." />
        </div>
      </div>

      <!-- Multiple Selection -->
      <div class="rounded-lg border p-4">
        <h2 class="mb-4 text-lg font-semibold">Multiple Selection</h2>
        <div class="flex items-center gap-4">
          <div class="w-64">
            <NuGridSelectMenu
              v-model="selectedMultiple"
              :items="statusItems"
              value-key="value"
              label-key="label"
              multiple
              placeholder="Select statuses..."
              close-on-tab
              open-on-focus
            />
          </div>
          <div class="text-sm">
            Selected: <code class="rounded bg-default px-1">{{ selectedMultiple }}</code>
          </div>
        </div>
      </div>

      <!-- With Searchable -->
      <div class="rounded-lg border p-4">
        <h2 class="mb-4 text-lg font-semibold">With Search</h2>
        <div class="flex items-center gap-4">
          <div class="w-64">
            <NuGridSelectMenu
              v-model="selectedCategory"
              :items="categoryItems"
              value-key="value"
              label-key="label"
              description-key="description"
              :search-input="{ placeholder: 'Search categories...' }"
              placeholder="Select category..."
              close-on-tab
              open-on-focus
            />
          </div>
          <div class="text-sm text-muted">
            Type to search/filter items
          </div>
        </div>
      </div>

      <!-- Text input after dropdowns -->
      <div class="rounded-lg border p-4">
        <h2 class="mb-4 text-lg font-semibold">Text Input (After)</h2>
        <div class="w-64">
          <UInput v-model="textAfter" placeholder="Tab navigation test..." />
        </div>
      </div>
    </div>

    <div class="mt-8 rounded bg-default/50 p-4 text-sm text-muted">
      <h3 class="mb-2 font-semibold">Notes:</h3>
      <ul class="list-inside list-disc space-y-1">
        <li>This page tests the local NuGridSelectMenu component</li>
        <li>It should behave identically to Nuxt UI's USelectMenu</li>
        <li>Once working, we can add highlight-on-open functionality</li>
      </ul>
    </div>
  </div>
</template>
