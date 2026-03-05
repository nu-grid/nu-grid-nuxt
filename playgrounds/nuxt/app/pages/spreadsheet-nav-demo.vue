<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

// Template refs for inter-grid linking
const incomeGrid = useTemplateRef('incomeGrid')
const deductionsGrid = useTemplateRef('deductionsGrid')
const creditsGrid = useTemplateRef('creditsGrid')

// --- Income Grid ---
interface IncomeItem {
  id: number
  source: string
  amount: number
  frequency: string
  notes: string
}

const incomeData = ref<IncomeItem[]>([
  { id: 1, source: 'Salary', amount: 85000, frequency: 'Annual', notes: 'Full-time position' },
  { id: 2, source: 'Freelance', amount: 12000, frequency: 'Monthly', notes: 'Web development' },
  { id: 3, source: 'Dividends', amount: 3200, frequency: 'Quarterly', notes: 'Index funds' },
])

const incomeColumns: NuGridColumn<IncomeItem>[] = [
  { accessorKey: 'source', header: 'Source', size: 160, cellDataType: 'text' },
  { accessorKey: 'amount', header: 'Amount', size: 120, cellDataType: 'currency' },
  { accessorKey: 'frequency', header: 'Frequency', size: 120, cellDataType: 'text' },
  { accessorKey: 'notes', header: 'Notes', size: 200, cellDataType: 'text' },
]

// --- Deductions Grid ---
interface DeductionItem {
  id: number
  category: string
  amount: number
  taxYear: string
  notes: string
}

const deductionsData = ref<DeductionItem[]>([
  { id: 1, category: 'Mortgage Interest', amount: 14200, taxYear: '2025', notes: 'Primary residence' },
  { id: 2, category: 'State Taxes', amount: 8500, taxYear: '2025', notes: 'Income tax' },
  { id: 3, category: 'Charitable', amount: 3000, taxYear: '2025', notes: 'Various nonprofits' },
  { id: 4, category: 'Medical', amount: 2100, taxYear: '2025', notes: 'Out-of-pocket' },
])

const deductionsColumns: NuGridColumn<DeductionItem>[] = [
  { accessorKey: 'category', header: 'Category', size: 160, cellDataType: 'text' },
  { accessorKey: 'amount', header: 'Amount', size: 120, cellDataType: 'currency' },
  { accessorKey: 'taxYear', header: 'Tax Year', size: 100, cellDataType: 'text' },
  { accessorKey: 'notes', header: 'Notes', size: 200, cellDataType: 'text' },
]

// --- Credits Grid ---
interface CreditItem {
  id: number
  credit: string
  amount: number
  eligible: boolean
  notes: string
}

const creditsData = ref<CreditItem[]>([
  { id: 1, credit: 'Child Tax Credit', amount: 2000, eligible: true, notes: 'Per qualifying child' },
  { id: 2, credit: 'Education Credit', amount: 2500, eligible: true, notes: 'American Opportunity' },
  { id: 3, credit: 'Energy Credit', amount: 1200, eligible: false, notes: 'Solar panels pending' },
])

const creditsColumns: NuGridColumn<CreditItem>[] = [
  { accessorKey: 'credit', header: 'Credit', size: 160, cellDataType: 'text' },
  { accessorKey: 'amount', header: 'Amount', size: 120, cellDataType: 'currency' },
  { accessorKey: 'eligible', header: 'Eligible', size: 80, cellDataType: 'boolean' },
  { accessorKey: 'notes', header: 'Notes', size: 200, cellDataType: 'text' },
]

// Spreadsheet nav options — link the three grids vertically
const incomeSpreadsheetNav = computed(() => ({
  nextGrid: deductionsGrid,
}))

const deductionsSpreadsheetNav = computed(() => ({
  previousGrid: incomeGrid,
  nextGrid: creditsGrid,
}))

const creditsSpreadsheetNav = computed(() => ({
  previousGrid: deductionsGrid,
}))

// Totals
const incomeTotal = computed(() => incomeData.value.reduce((sum, r) => sum + (r.amount || 0), 0))
const deductionsTotal = computed(() => deductionsData.value.reduce((sum, r) => sum + (r.amount || 0), 0))
const creditsTotal = computed(() => creditsData.value.reduce((sum, r) => sum + (r.amount || 0), 0))

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const exampleCode = `<!-- Link three grids as one spreadsheet -->
<NuGrid
  ref="incomeGrid"
  :spreadsheet-nav="{ nextGrid: deductionsGrid }"
  :editing="{ enabled: true, startClicks: 'single', enterBehavior: 'moveDown' }"
  :focus="{ mode: 'cell' }"
  :add-new-row="{ position: 'bottom' }"
/>

<NuGrid
  ref="deductionsGrid"
  :spreadsheet-nav="{ previousGrid: incomeGrid, nextGrid: creditsGrid }"
  ...
/>

<NuGrid
  ref="creditsGrid"
  :spreadsheet-nav="{ previousGrid: deductionsGrid }"
  ...
/>`
</script>

<template>
  <DemoLayout
    id="spreadsheet-nav-demo"
    title="Spreadsheet Navigation Demo"
    info-label="About Spreadsheet Navigation"
    sidebar-width="220px"
    grid-height="auto"
  >
    <template #status>
      <DemoStatusItem label="Income" :value="fmt(incomeTotal)" />
      <DemoStatusItem label="Deductions" :value="fmt(deductionsTotal)" />
      <DemoStatusItem label="Credits" :value="fmt(creditsTotal)" />
    </template>

    <template #info>
      <p class="text-muted mb-3 text-sm">
        Three linked grids behave as one continuous spreadsheet. Navigation flows seamlessly between
        them using arrow keys, Tab, and Enter.
      </p>
      <ul class="text-muted list-inside list-disc space-y-1 text-sm">
        <li><strong>ArrowUp/Down:</strong> Navigate between rows, crossing grid boundaries</li>
        <li><strong>ArrowLeft/Right:</strong> Move between cells when cursor is at text boundary</li>
        <li><strong>Tab/Shift+Tab:</strong> Move to next/previous editable cell</li>
        <li><strong>Enter:</strong> Save and move down (moveDown mode)</li>
        <li><strong>Add Row:</strong> Each grid has an add-row at the bottom</li>
        <li>Single-click any cell to start editing</li>
      </ul>
    </template>

    <!-- Override default slot with custom multi-grid layout (no outer border/height wrapper) -->
    <div class="space-y-6 p-1">
      <!-- Income Section -->
      <div>
        <h3 class="text-highlighted mb-2 flex items-center gap-2 text-sm font-semibold">
          <UIcon name="i-lucide-trending-up" class="text-success size-4" />
          Income
        </h3>
        <div class="border-default overflow-auto rounded-lg border">
          <NuGrid
            ref="incomeGrid"
            :data="incomeData"
            :columns="incomeColumns"
            :spreadsheet-nav="incomeSpreadsheetNav"
            :editing="{ enabled: true, startClicks: 'single', enterBehavior: 'moveDown', startKeys: 'all' }"
            :focus="{ mode: 'cell' }"
            :add-new-row="{ position: 'bottom' }"
            resize-columns
          />
        </div>
      </div>

      <!-- Deductions Section -->
      <div>
        <h3 class="text-highlighted mb-2 flex items-center gap-2 text-sm font-semibold">
          <UIcon name="i-lucide-trending-down" class="text-error size-4" />
          Deductions
        </h3>
        <div class="border-default overflow-auto rounded-lg border">
          <NuGrid
            ref="deductionsGrid"
            :data="deductionsData"
            :columns="deductionsColumns"
            :spreadsheet-nav="deductionsSpreadsheetNav"
            :editing="{ enabled: true, startClicks: 'single', enterBehavior: 'moveDown', startKeys: 'all' }"
            :focus="{ mode: 'cell' }"
            :add-new-row="{ position: 'bottom' }"
            resize-columns
          />
        </div>
      </div>

      <!-- Credits Section -->
      <div>
        <h3 class="text-highlighted mb-2 flex items-center gap-2 text-sm font-semibold">
          <UIcon name="i-lucide-badge-check" class="text-info size-4" />
          Credits
        </h3>
        <div class="border-default overflow-auto rounded-lg border">
          <NuGrid
            ref="creditsGrid"
            :data="creditsData"
            :columns="creditsColumns"
            :spreadsheet-nav="creditsSpreadsheetNav"
            :editing="{ enabled: true, startClicks: 'single', enterBehavior: 'moveDown', startKeys: 'all' }"
            :focus="{ mode: 'cell' }"
            :add-new-row="{ position: 'bottom' }"
            resize-columns
          />
        </div>
      </div>
    </div>

    <template #code>
      <DemoCodeBlock title="Spreadsheet Navigation Configuration:" :code="exampleCode" />
    </template>
  </DemoLayout>
</template>
