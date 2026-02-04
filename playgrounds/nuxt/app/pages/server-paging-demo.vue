<script setup lang="ts">
import type { NuGridColumn, NuGridPageChangedEvent, NuGridPagingOptions } from '#nu-grid/types'
import type { User } from '../../server/data/gridTestData'

// Server-side pagination state
const pageIndex = ref(0)
const pageSize = ref(20)
const globalFilter = ref('')

// Use useFetch for SSR-compatible data fetching
const {
  data: response,
  status,
  refresh,
} = await useFetch('/api/users', {
  query: computed(() => ({
    pageIndex: pageIndex.value,
    pageSize: pageSize.value,
    sorting: '[]',
    globalFilter: globalFilter.value,
  })),
  watch: false, // Don't auto-refetch on query change - we control when to fetch
})

// Computed values from response
const data = computed(() => response.value?.data ?? [])
const totalCount = computed(() => response.value?.totalCount ?? 0)
const isLoading = computed(() => status.value === 'pending')

// Handle page changes from the grid
async function handlePageChanged(event: NuGridPageChangedEvent) {
  pageIndex.value = event.pageIndex
  pageSize.value = event.pageSize
  if (event.globalFilter !== undefined) {
    globalFilter.value = event.globalFilter
  }
  await refresh()
}

// Handle search - reset to page 0
async function handleSearch() {
  pageIndex.value = 0
  await refresh()
}

// Pagination options for server-side mode
const paginationOptions = computed<NuGridPagingOptions>(() => ({
  enabled: true,
  pageSize: pageSize.value,
  pageSizeSelector: [10, 20, 50, 100],
  manualPagination: true,
  rowCount: totalCount.value,
}))

const { focusMode, toggleFocusMode, focusModeIcon, focusModeLabel } = useFocusModeToggle()

// Status colors for display
const statusColors: Record<string, string> = {
  subscribed: 'text-success',
  unsubscribed: 'text-warning',
  bounced: 'text-error',
}

const statusLabels: Record<string, string> = {
  subscribed: 'Subscribed',
  unsubscribed: 'Unsubscribed',
  bounced: 'Bounced',
}

// Columns with sorting enabled
const columns = computed<NuGridColumn<User>[]>(() => [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60,
    enableSorting: true,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 180,
    enableSorting: true,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    size: 280,
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    enableSorting: true,
    cell: ({ row }) =>
      h('span', { class: statusColors[row.original.status] }, statusLabels[row.original.status]),
  },
  {
    accessorKey: 'location',
    header: 'Location',
    size: 180,
    enableSorting: true,
  },
])

const exampleCode = `// Pagination options for server-side mode
const paginationOptions = computed<NuGridPagingOptions>(() => ({
  enabled: true,
  pageSize: pageSize.value,
  manualPagination: true,  // Tell grid not to slice data
  rowCount: totalCount.value,  // Total rows from server
}))

// Handle page changes from the grid
async function handlePageChanged(event: NuGridPageChangedEvent) {
  pageIndex.value = event.pageIndex
  pageSize.value = event.pageSize
  await refresh()  // Refetch data from server
}

// Template:
<NuGrid
  :data="data"
  :columns="columns"
  :paging="paginationOptions"
  @page-changed="handlePageChanged"
/>`
</script>

<template>
  <DemoLayout
    id="server-paging-demo"
    title="Server-Side Paging Demo"
    info-label="About Server-Side Paging"
  >
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Total Rows" :value="totalCount" />
      <DemoStatusItem label="Current Page" :value="pageIndex + 1" />
      <DemoStatusItem label="Page Size" :value="pageSize" />
      <DemoStatusItem label="Loading" :value="isLoading ? 'Yes' : 'No'" />
      <DemoStatusItem label="Rows Loaded" :value="data.length" />
      <DemoStatusItem label="Search" :value="globalFilter || 'None'" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Server Search">
        <UInput
          v-model="globalFilter"
          placeholder="Search name, email, location..."
          icon="i-lucide-search"
          size="sm"
          @keyup.enter="handleSearch"
        />
        <UButton
          block
          color="primary"
          size="sm"
          icon="i-lucide-search"
          :loading="isLoading"
          @click="handleSearch"
        >
          Search
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Server Actions">
        <UButton
          block
          color="neutral"
          variant="outline"
          :loading="isLoading"
          icon="i-lucide-refresh-cw"
          size="sm"
          @click="refresh()"
        >
          Refresh Data
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Focus Mode">
        <UButton
          block
          color="neutral"
          variant="outline"
          :icon="focusModeIcon"
          size="sm"
          @click="toggleFocusMode"
        >
          {{ focusModeLabel }}
        </UButton>
      </DemoControlGroup>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-dimmed">
        This demo shows server-side pagination with SSR support. Data is fetched on the server
        during initial render, so the page loads with data already visible.
      </p>

      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-dimmed">
        <strong>Key Options:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li><strong>manualPagination:</strong> Set to true for server-side pagination</li>
          <li><strong>rowCount:</strong> Total rows from server (for page calculation)</li>
          <li><strong>@page-changed:</strong> Event fired when user changes page</li>
        </ul>
      </div>

      <div class="rounded bg-default/50 p-2 text-sm text-dimmed">
        <strong>Try It:</strong>
        <p class="mt-1">
          Use the pagination controls to navigate pages. Use the search box to filter on the server.
          Hard refresh (Cmd+Shift+R) to see SSR in action.
        </p>
      </div>
    </template>

    <!-- Grid -->
    <!-- Note: Don't use v-model:global-filter for server-side filtering - it enables client-side filtering -->
    <NuGrid
      :data="data"
      :columns="columns"
      :paging="paginationOptions"
      :focus="{ mode: focusMode }"
      :layout="{ mode: 'div', stickyHeaders: true }"
      :class="{ 'opacity-50': isLoading }"
      @page-changed="handlePageChanged"
    />

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Server-Side Pagination (SSR):" :code="exampleCode" />
    </template>

    <!-- Extra: Implementation Notes -->
    <template #extra>
      <UAccordion
        :items="[{ label: 'Implementation Notes', icon: 'i-lucide-file-text', slot: 'notes' }]"
      >
        <template #notes>
          <div class="space-y-2 p-4 text-sm text-dimmed">
            <p><strong>Key Points:</strong></p>
            <ul class="list-inside list-disc space-y-1">
              <li>
                <strong>useFetch:</strong> Enables SSR - data loads on server, no flash of empty
                content
              </li>
              <li>
                <strong>manualPagination: true:</strong> Grid doesn't slice data (server already
                did)
              </li>
              <li><strong>rowCount:</strong> Required for grid to calculate total pages</li>
              <li><strong>@page-changed:</strong> Call refresh() to fetch new page from server</li>
            </ul>

            <p class="mt-3"><strong>pageChanged Event Payload:</strong></p>
            <pre class="mt-1 rounded bg-default p-2 text-xs">{{
              JSON.stringify(
                {
                  pageIndex: 0,
                  pageSize: 20,
                  sorting: [],
                  columnFilters: [],
                  globalFilter: '',
                },
                null,
                2,
              )
            }}</pre>
          </div>
        </template>
      </UAccordion>
    </template>
  </DemoLayout>
</template>
