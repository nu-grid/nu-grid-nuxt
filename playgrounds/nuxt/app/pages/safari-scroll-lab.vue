<script setup lang="ts">
// SAFARI SCROLL LAB (temporary, branch safari-scroll-lab). Not for merge.
//
// Reproduces a Safari misclick ("click a row or two under the one you want, after editing a few rows")
// with an editable grid of lookup columns, and lets each wheel-scroll strategy be tried in
// real Safari. Every pointerdown on the grid is probed three ways:
//   target  the row the browser dispatched the event to (event.target)
//   point   a fresh hit test at the same coordinates (document.elementFromPoint)
//   geom    the row whose layout box contains the pointer (getBoundingClientRect)
// None of these can see what Safari *painted*, so the scorecard also has a human column: press W
// (or the button) right after a click that picked the wrong row.
import type { NuGridColumn } from '#nu-grid/types'

type Strategy = 'relative' | 'absolute' | 'resync' | 'native'

interface Row {
  id: number
  account: string
  formLine: string
  subGroup: string
  amount: number
  note: string
}

const strategies: { value: Strategy; label: string; hint: string }[] = [
  { value: 'relative', label: 'Relative (today)', hint: 'scrollBy(step) per frame' },
  { value: 'absolute', label: 'Absolute', hint: 'scrollTo(tracked + step), no re-reads mid-burst' },
  { value: 'resync', label: 'Resync', hint: 'relative + scrollTop = scrollTop when a burst settles' },
  { value: 'native', label: 'Native (#569)', hint: 'no wheel listener at all' },
]

const strategy = ref<Strategy>('relative')
const keepRemainder = ref(false)
const virtualized = ref(false)
// Off by default: every probe forces Safari to read layout or scroll position (elementFromPoint,
// getBoundingClientRect, scrollTop), and any of those can make it reconcile the drift we are trying
// to reproduce. With probes off the grid runs exactly as production; only W presses are recorded.
const probing = ref(false)
const gridKey = computed(() => `${strategy.value}-${virtualized.value}`)

// ---- data: an account list with lookup columns ----------------------------------------------
const formLines = [
  '1a Gross receipts',
  '2 Cost of goods sold',
  '8 Advertising',
  '9 Car and truck expenses',
  '10 Commissions and fees',
  '15 Insurance',
  '17 Legal and professional',
  '18 Office expense',
  '20b Rent – other business property',
  '24a Travel',
  '25 Utilities',
  '27a Other expenses',
].map((label) => ({ value: label, label }))
const subGroups = ['Operating', 'Payroll', 'Occupancy', 'Vehicle', 'Professional', 'Other'].map(
  (label) => ({ value: label, label }),
)
const words = ['Retail', 'Wholesale', 'Online', 'Services', 'Parts', 'Freight', 'Fuel', 'Repairs']

const data = ref<Row[]>(
  Array.from({ length: 400 }, (_, i) => ({
    id: i + 1,
    account: `${4000 + i * 10} · ${words[i % words.length]} ${Math.floor(i / words.length) + 1}`,
    formLine: formLines[i % formLines.length]!.value,
    subGroup: subGroups[i % subGroups.length]!.value,
    amount: Math.round(((i * 7919) % 100000) * 1.37) / 100,
    note: '',
  })),
)
const labelFor = (id: string | undefined) => {
  if (!id) return '—'
  const row = data.value.find((r) => String(r.id) === id)
  return row ? `#${row.id} ${row.account}` : `#${id}`
}

const columns = computed<NuGridColumn<Row>[]>(() => [
  { accessorKey: 'id', header: '#', size: 60, enableEditing: false },
  { accessorKey: 'account', header: 'Account Name', size: 300, minSize: 200 },
  {
    accessorKey: 'formLine',
    header: 'Form Line',
    size: 400,
    minSize: 400,
    cellDataType: 'lookup',
    lookup: { items: formLines, valueKey: 'value', labelKey: 'label', searchable: true },
  },
  {
    accessorKey: 'subGroup',
    header: 'Sub Group',
    size: 300,
    minSize: 300,
    cellDataType: 'lookup',
    lookup: { items: subGroups, valueKey: 'value', labelKey: 'label', searchable: true },
  },
  { accessorKey: 'amount', header: 'Amount', size: 140, cellDataType: 'currency' },
  { accessorKey: 'note', header: 'Note', size: 260 },
])

// ---- lab hook -------------------------------------------------------------------------------
const bursts = ref(0)
const resyncs = ref(0)
const hoverStale = ref(0)
// Per strategy: settles, and settles where :hover disagreed with a fresh hit test.
const settleBy = ref<Record<string, { settles: number; stale: number }>>({})
const settles = ref(0)
let lastPointer: { x: number; y: number } | null = null

function rowIdAt(el: Element | null | undefined) {
  return (el?.closest('[data-row-id]') as HTMLElement | null)?.dataset.rowId
}

function hoveredRowId() {
  const hovered = document.querySelectorAll(':hover')
  return rowIdAt(hovered[hovered.length - 1] ?? null)
}

function installLab() {
  ;(globalThis as any).__nuGridScrollLab = {
    strategy: strategy.value,
    keepRemainder: keepRemainder.value,
    onEvent(kind: string) {
      if (kind === 'burst-start') bursts.value++
      if (kind === 'resync') resyncs.value++
    },
  }
}
installLab()

// Settle = no scroll event on the grid for 150ms. Measured from the browser's own scroll events so
// every strategy, Native included, is judged the same way. Pointer hasn't moved but the rows under
// it have: does Safari's :hover agree with a fresh hit test?
let settleTimer: ReturnType<typeof setTimeout> | null = null
function onGridScroll() {
  if (settleTimer) clearTimeout(settleTimer)
  if (!probing.value) return
  settleTimer = setTimeout(() => {
    settles.value++
    const bucket = (settleBy.value[strategy.value] ??= { settles: 0, stale: 0 })
    bucket.settles++
    if (!lastPointer) return
    const point = rowIdAt(document.elementFromPoint(lastPointer.x, lastPointer.y))
    const hover = hoveredRowId()
    if (point && hover && point !== hover) {
      hoverStale.value++
      bucket.stale++
    }
  }, 150)
}
watch([strategy, keepRemainder], installLab)
onBeforeUnmount(() => {
  delete (globalThis as any).__nuGridScrollLab
})

// ---- click probe ----------------------------------------------------------------------------
interface Probe {
  n: number
  strategy: Strategy
  keepRemainder: boolean
  virtualized: boolean
  probing: boolean
  target?: string
  point?: string
  geom?: string
  scrollTop: number
  humanWrong: boolean
}
const probes = ref<Probe[]>([])
const wrap = ref<HTMLElement | null>(null)

function scrollerOf(el: Element | null): HTMLElement | null {
  let node = el as HTMLElement | null
  while (node && node !== wrap.value) {
    const s = getComputedStyle(node)
    if (/(auto|scroll)/.test(s.overflowY) && node.scrollHeight > node.clientHeight) return node
    node = node.parentElement
  }
  return null
}

function onPointerMove(e: PointerEvent) {
  lastPointer = { x: e.clientX, y: e.clientY }
}

function onPointerDown(e: PointerEvent) {
  lastPointer = { x: e.clientX, y: e.clientY }
  if (!probing.value) {
    // Only proof the click happened on a row; closest() walks the DOM without forcing layout.
    if (!(e.target as Element).closest('[data-row-id]')) return
    probes.value.unshift({
      n: probes.value.length + 1,
      strategy: strategy.value,
      keepRemainder: keepRemainder.value,
      virtualized: virtualized.value,
      probing: false,
      scrollTop: -1,
      humanWrong: false,
    })
    return
  }
  const targetEl = e.target as Element
  const target = rowIdAt(targetEl)
  const point = rowIdAt(document.elementFromPoint(e.clientX, e.clientY))
  let geom: string | undefined
  wrap.value?.querySelectorAll<HTMLElement>('[data-row-id]').forEach((r) => {
    const b = r.getBoundingClientRect()
    if (e.clientY >= b.top && e.clientY < b.bottom) geom = r.dataset.rowId
  })
  if (!target && !point) return
  probes.value.unshift({
    n: probes.value.length + 1,
    strategy: strategy.value,
    keepRemainder: keepRemainder.value,
    virtualized: virtualized.value,
    probing: true,
    target,
    point,
    geom,
    scrollTop: Math.round(scrollerOf(targetEl)?.scrollTop ?? -1),
    humanWrong: false,
  })
}

function markWrong() {
  const last = probes.value[0]
  if (last) last.humanWrong = true
}
function onKey(e: KeyboardEvent) {
  // W, but not while typing in a cell editor.
  if (e.key.toLowerCase() !== 'w' || e.metaKey || e.ctrlKey) return
  const t = e.target as HTMLElement
  if (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
  markWrong()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const scorecard = computed(() =>
  strategies.map((s) => {
    const rows = probes.value.filter((p) => p.strategy === s.value)
    return {
      ...s,
      clicks: rows.length,
      human: rows.filter((p) => p.humanWrong).length,
      targetVsPoint: rows.filter((p) => p.probing && p.target !== p.point).length,
      pointVsGeom: rows.filter((p) => p.probing && p.point !== p.geom).length,
      settles: settleBy.value[s.value]?.settles ?? 0,
      staleHover: settleBy.value[s.value]?.stale ?? 0,
    }
  }),
)

const isSafari = import.meta.client && navigator.vendor === 'Apple Computer, Inc.'
const copied = ref(false)
async function copyResults() {
  const payload = {
    userAgent: navigator.userAgent,
    vendor: navigator.vendor,
    counters: {
      bursts: bursts.value,
      settles: settles.value,
      resyncs: resyncs.value,
      hoverStale: hoverStale.value,
    },
    scorecard: scorecard.value.map(({ hint: _hint, ...s }) => s),
    probes: probes.value,
  }
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
function reset() {
  probes.value = []
  bursts.value = settles.value = resyncs.value = hoverStale.value = 0
  settleBy.value = {}
}
</script>

<template>
  <div class="flex h-full flex-col gap-3 p-4">
    <div class="flex flex-wrap items-center gap-2">
      <h1 class="mr-2 text-lg font-semibold">Safari scroll lab</h1>
      <span
        class="rounded px-2 py-0.5 text-xs font-medium"
        :class="isSafari ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'"
      >
        {{ isSafari ? 'Safari / WebKit' : 'Not WebKit — open this in Safari' }}
      </span>
      <div class="ml-auto flex gap-2">
        <UButton size="sm" variant="outline" color="error" @click="markWrong">
          Last click was wrong (W)
        </UButton>
        <UButton size="sm" variant="outline" @click="copyResults">
          {{ copied ? 'Copied' : 'Copy results' }}
        </UButton>
        <UButton size="sm" variant="ghost" @click="reset">Reset</UButton>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <UButton
        v-for="s in strategies"
        :key="s.value"
        size="sm"
        :variant="strategy === s.value ? 'solid' : 'outline'"
        :title="s.hint"
        @click="strategy = s.value"
      >
        {{ s.label }}
      </UButton>
      <label class="ml-4 flex items-center gap-2 text-sm">
        <USwitch v-model="keepRemainder" /> Keep remainder on settle
      </label>
      <label class="flex items-center gap-2 text-sm">
        <USwitch v-model="virtualized" /> Virtualized rows
      </label>
      <label class="flex items-center gap-2 text-sm" title="Probes read layout on every click and scroll, which can mask the bug">
        <USwitch v-model="probing" /> Probes (can mask the bug)
      </label>
    </div>

    <p class="text-muted text-xs">
      Scroll with the trackpad and the mouse wheel, edit a few cells (Form Line and Sub Group are
      lookups), then click rows. If the row that highlights isn't the one under the pointer,
      press <kbd>W</kbd>. Switching strategy remounts the grid.
    </p>

    <div
      ref="wrap"
      class="border-default h-[62vh] min-h-0 rounded-lg border"
      @pointerdown.capture="onPointerDown"
      @pointermove.passive="onPointerMove"
      @scroll.capture.passive="onGridScroll"
    >
      <NuGrid
        :key="gridKey"
        :data="data"
        :columns="columns"
        row-id="id"
        theme="compact"
        :layout="{ stickyHeaders: true }"
        :focus="{ mode: 'cell', autoFocus: false }"
        :editing="{ enabled: true, startClicks: 'single' }"
        :virtualization="virtualized ? { enabled: true } : undefined"
        spreadsheet-nav
        :add-new-row="false"
      />
    </div>

    <div class="grid gap-3 lg:grid-cols-2">
      <table class="w-full text-xs">
        <thead class="text-muted text-left">
          <tr>
            <th class="py-1">Strategy</th>
            <th>Clicks</th>
            <th title="You pressed W">Human: wrong</th>
            <th title="event.target row ≠ fresh hit test">target≠point</th>
            <th title="fresh hit test ≠ layout box">point≠geom</th>
            <th title="scroll settled; :hover row ≠ row under the pointer">stale hover / settles</th>
          </tr>
        </thead>
        <tbody class="font-mono">
          <tr v-for="s in scorecard" :key="s.value" :class="s.value === strategy ? 'font-semibold' : ''">
            <td class="py-0.5 font-sans">{{ s.label }}</td>
            <td>{{ s.clicks }}</td>
            <td :class="s.human ? 'text-error' : ''">{{ s.human }}</td>
            <td :class="s.targetVsPoint ? 'text-error' : ''">{{ s.targetVsPoint }}</td>
            <td :class="s.pointVsGeom ? 'text-error' : ''">{{ s.pointVsGeom }}</td>
            <td :class="s.staleHover ? 'text-warning' : ''">{{ s.staleHover }} / {{ s.settles }}</td>
          </tr>
          <tr class="text-muted font-sans">
            <td colspan="6" class="pt-2">
              bursts {{ bursts }} · settles {{ settles }} · resyncs {{ resyncs }} ·
              <span :class="hoverStale ? 'text-warning' : ''">stale hover after settle {{ hoverStale }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="max-h-48 overflow-auto text-xs">
        <div v-for="p in probes.slice(0, 30)" :key="p.n" class="flex gap-2 py-0.5" :class="p.humanWrong ? 'text-error' : ''">
          <span class="text-muted w-8 font-mono">{{ p.n }}</span>
          <span class="w-20">{{ p.strategy }}</span>
          <span class="flex-1 truncate">{{ labelFor(p.target) }}</span>
          <span v-if="p.point !== p.target" class="text-warning truncate">point {{ labelFor(p.point) }}</span>
          <span v-if="p.geom !== p.point" class="text-warning truncate">geom {{ labelFor(p.geom) }}</span>
          <span class="text-muted font-mono">↕{{ p.scrollTop }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
