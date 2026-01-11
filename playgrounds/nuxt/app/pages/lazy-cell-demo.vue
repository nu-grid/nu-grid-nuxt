<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

const table = useTemplateRef('table')

// Sample data with image URLs
interface Product {
  id: number
  name: string
  category: string
  price: number
  imageUrl: string
  thumbnailUrl: string
  description: string
}

// Generate sample products with placeholder images
function generateProducts(count: number): Product[] {
  const categories = ['Electronics', 'Clothing', 'Home', 'Sports', 'Books', 'Toys']
  const products: Product[] = []

  for (let i = 1; i <= count; i++) {
    const category = categories[i % categories.length]!
    products.push({
      id: i,
      name: `Product ${i} - ${category} Item`,
      category,
      price: Math.round(Math.random() * 500 + 10),
      // Using picsum.photos for random images (each ID gives consistent image)
      imageUrl: `https://picsum.photos/seed/${i}/200/200`,
      thumbnailUrl: `https://picsum.photos/seed/${i}/80/80`,
      description: `This is a great ${category.toLowerCase()} product with amazing features.`,
    })
  }

  return products
}

const data = ref(generateProducts(200))

// Control options
const waitForSettle = ref(true)
const preloadDistance = ref(100)
const showPlaceholderType = ref<'skeleton' | 'color' | 'icon' | 'custom'>('skeleton')
const imageSize = ref(60)
const keepMounted = ref(true)
const showComparison = ref(false)

const { focusMode, toggleFocusMode, focusModeIcon, focusModeLabel } = useFocusModeToggle()

// Columns with LazyCell for images
const columns = computed<NuGridColumn<Product>[]>(() => [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60,
    enableEditing: false,
  },
  {
    accessorKey: 'imageUrl',
    header: 'Image (LazyCell)',
    size: imageSize.value + 40,
    enableEditing: false,
    cell: ({ row }) =>
      h(
        resolveComponent('NuGridLazyCell') as any,
        {
          waitForSettle: waitForSettle.value,
          preloadDistance: preloadDistance.value,
          keepMounted: keepMounted.value,
          height: imageSize.value,
          width: imageSize.value,
        },
        {
          default: () =>
            h('img', {
              src: row.original.thumbnailUrl,
              alt: row.original.name,
              class: 'rounded object-cover',
              style: {
                width: `${imageSize.value}px`,
                height: `${imageSize.value}px`,
              },
              loading: 'lazy',
            }),
          placeholder: () => renderPlaceholder(),
        },
      ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 200,
  },
  {
    accessorKey: 'category',
    header: 'Category',
    size: 120,
  },
  {
    accessorKey: 'price',
    header: 'Price',
    size: 100,
    cell: ({ row }) => h('span', `$${row.original.price.toFixed(2)}`),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    size: 300,
  },
])

// Render placeholder based on selected type
function renderPlaceholder() {
  const size = imageSize.value
  const style = { width: `${size}px`, height: `${size}px` }

  switch (showPlaceholderType.value) {
    case 'color':
      return h('div', {
        class: 'rounded bg-gray-200 dark:bg-gray-700',
        style,
      })
    case 'icon':
      return h(
        'div',
        {
          class:
            'rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400',
          style,
        },
        [
          h(resolveComponent('UIcon') as any, {
            name: 'i-lucide-image',
            class: 'w-6 h-6',
          }),
        ],
      )
    case 'custom':
      return h(
        'div',
        {
          class:
            'rounded bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center',
          style,
        },
        [h('span', { class: 'text-xs text-gray-500 dark:text-gray-400' }, 'Loading...')],
      )
    default: // skeleton
      return h('div', {
        class: 'rounded',
        style: {
          ...style,
          background:
            'linear-gradient(90deg, rgba(128,128,128,0.1) 25%, rgba(128,128,128,0.2) 50%, rgba(128,128,128,0.1) 75%)',
          backgroundSize: '200% 100%',
          animation: 'lazy-cell-shimmer 1.5s infinite',
        },
      })
  }
}

// For comparison: regular image column without LazyCell
const columnsWithRegularImages = computed<NuGridColumn<Product>[]>(() => [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60,
    enableEditing: false,
  },
  {
    accessorKey: 'imageUrl',
    header: 'Image (Regular)',
    size: imageSize.value + 40,
    enableEditing: false,
    cell: ({ row }) =>
      h('img', {
        src: row.original.thumbnailUrl,
        alt: row.original.name,
        class: 'rounded object-cover',
        style: {
          width: `${imageSize.value}px`,
          height: `${imageSize.value}px`,
        },
        loading: 'lazy',
      }),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 200,
  },
  {
    accessorKey: 'category',
    header: 'Category',
    size: 120,
  },
  {
    accessorKey: 'price',
    header: 'Price',
    size: 100,
    cell: ({ row }) => h('span', `$${row.original.price.toFixed(2)}`),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    size: 300,
  },
])

// Shuffle data to demonstrate scroll behavior
function shuffleData() {
  const shuffled = [...data.value]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]!
    shuffled[i] = shuffled[j]!
    shuffled[j] = temp
  }
  data.value = shuffled
}

const placeholderOptions = [
  { label: 'Skeleton Shimmer', value: 'skeleton' },
  { label: 'Solid Color', value: 'color' },
  { label: 'Icon', value: 'icon' },
  { label: 'Custom Text', value: 'custom' },
]
</script>

<template>
  <DemoLayout id="lazy-cell-demo" title="LazyCell Demo" sidebar-width="300px">
    <template #status>
      <DemoStatusItem label="Rows" :value="data.length" />
      <DemoStatusItem label="Wait for Settle" :value="waitForSettle" boolean />
      <DemoStatusItem label="Keep Mounted" :value="keepMounted" boolean />
      <DemoStatusItem label="Preload Distance" :value="`${preloadDistance}px`" />
      <DemoStatusItem label="Placeholder" :value="showPlaceholderType" />
      <DemoStatusItem label="Comparison" :value="showComparison" boolean />
    </template>

    <template #controls>
      <DemoControlGroup label="Loading Behavior">
        <UButton
          :color="waitForSettle ? 'success' : 'warning'"
          :variant="waitForSettle ? 'solid' : 'outline'"
          icon="i-lucide-pause"
          block
          @click="waitForSettle = !waitForSettle"
        >
          {{ waitForSettle ? 'Wait for Settle' : 'Load Immediately' }}
        </UButton>
        <UButton
          :color="keepMounted ? 'success' : 'neutral'"
          :variant="keepMounted ? 'solid' : 'outline'"
          icon="i-lucide-pin"
          block
          @click="keepMounted = !keepMounted"
        >
          {{ keepMounted ? 'Keep Mounted' : 'Re-lazy on Scroll' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Preload Distance">
        <div class="flex flex-wrap gap-1">
          <UButton
            v-for="dist in [0, 100, 300, 500]"
            :key="dist"
            :color="preloadDistance === dist ? 'primary' : 'neutral'"
            :variant="preloadDistance === dist ? 'solid' : 'outline'"
            size="xs"
            @click="preloadDistance = dist"
          >
            {{ dist }}px
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Placeholder Type">
        <USelectMenu
          v-model="showPlaceholderType"
          :items="placeholderOptions"
          value-key="value"
          class="w-full"
        />
      </DemoControlGroup>

      <DemoControlGroup label="Focus Mode">
        <UButton
          color="neutral"
          variant="outline"
          :icon="focusModeIcon"
          block
          @click="toggleFocusMode"
        >
          Focus: {{ focusModeLabel }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Actions">
        <UButton color="primary" icon="i-lucide-shuffle" block @click="shuffleData">
          Shuffle Data
        </UButton>
        <UButton
          :color="showComparison ? 'warning' : 'neutral'"
          :variant="showComparison ? 'solid' : 'outline'"
          icon="i-lucide-columns-2"
          block
          @click="showComparison = !showComparison"
        >
          {{ showComparison ? 'Hide' : 'Show' }} Comparison
        </UButton>
      </DemoControlGroup>
    </template>

    <template #info>
      <p class="mb-3 text-sm text-muted">
        <strong>LazyCell</strong> is a wrapper component that defers rendering expensive content
        (like images) until scrolling settles. This improves scroll performance by not loading
        images during fast scrolling.
      </p>

      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Key Features:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li><strong>waitForSettle:</strong> Waits for scroll to stop before showing content</li>
          <li>
            <strong>preloadDistance:</strong> Starts loading content N pixels before it's visible
          </li>
          <li>
            <strong>keepMounted:</strong> Once loaded, keeps content visible during future scrolls
          </li>
          <li>
            <strong>Custom placeholders:</strong> Use the placeholder slot for custom loading UI
          </li>
        </ul>
      </div>

      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>How It Works:</strong>
        <p class="mt-1">
          LazyCell uses IntersectionObserver to detect when content enters the viewport, and injects
          NuGrid's scroll state to know when scrolling has settled. The combination ensures smooth
          scrolling while still preloading content intelligently.
        </p>
      </div>
    </template>

    <!-- Main grid with LazyCell -->
    <div :class="showComparison ? 'grid h-full grid-cols-2 gap-4' : 'h-full'">
      <div class="h-full overflow-hidden">
        <h3 v-if="showComparison" class="mb-2 text-sm font-medium">With LazyCell</h3>
        <NuGrid
          ref="table"
          :data="data"
          :columns="columns"
          :virtualization="{ enabled: true, estimateSize: imageSize + 16 }"
          :focus="{ mode: focusMode }"
          :layout="{ mode: 'div', stickyHeaders: true }"
          :editing="{ enabled: true, startClicks: 'double' }"
          :ui="{
            root: 'h-full',
            base: 'w-max min-w-full border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
            td: 'border-b border-default py-2',
            separator: 'h-0',
          }"
        />
      </div>

      <!-- Comparison grid without LazyCell -->
      <div v-if="showComparison" class="h-full overflow-hidden">
        <h3 class="mb-2 text-sm font-medium">Without LazyCell (Regular Images)</h3>
        <NuGrid
          :data="data"
          :columns="columnsWithRegularImages"
          :virtualization="{ enabled: true, estimateSize: imageSize + 16 }"
          :focus="{ mode: focusMode }"
          :layout="{ mode: 'div', stickyHeaders: true }"
          :editing="{ enabled: true, startClicks: 'double' }"
          :ui="{
            root: 'h-full',
            base: 'w-max min-w-full border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
            td: 'border-b border-default py-2',
            separator: 'h-0',
          }"
        />
      </div>
    </div>

    <template #code>
      <DemoCodeBlock
        code='<!-- In a cell renderer or custom component -->
<NuGridLazyCell
  :wait-for-settle="true"
  :preload-distance="100"
  :keep-mounted="true"
  :height="60"
  :width="60"
>
  <!-- Your expensive content -->
  <img :src="imageUrl" />

  <!-- Optional: custom placeholder -->
  <template #placeholder>
    <div class="skeleton" />
  </template>
</NuGridLazyCell>

<!-- Or in a column definition using h() -->
{
  accessorKey: &apos;image&apos;,
  header: &apos;Image&apos;,
  cell: ({ row }) => h(
    resolveComponent(&apos;NuGridLazyCell&apos;),
    { waitForSettle: true, preloadDistance: 100 },
    {
      default: () => h(&apos;img&apos;, { src: row.original.imageUrl }),
      placeholder: () => h(&apos;div&apos;, { class: &apos;skeleton&apos; })
    }
  )
}'
      />
    </template>

    <template #extra>
      <UAccordion
        :items="[{ label: 'Props Reference', icon: 'i-lucide-book-open', slot: 'props' }]"
      >
        <template #props>
          <div class="p-4">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-default">
                  <th class="py-2 text-left">Prop</th>
                  <th class="py-2 text-left">Type</th>
                  <th class="py-2 text-left">Default</th>
                  <th class="py-2 text-left">Description</th>
                </tr>
              </thead>
              <tbody class="text-muted">
                <tr class="border-b border-default/50">
                  <td class="py-2 font-mono text-xs">waitForSettle</td>
                  <td class="py-2">boolean</td>
                  <td class="py-2">true</td>
                  <td class="py-2">Wait for scroll to stop before showing content</td>
                </tr>
                <tr class="border-b border-default/50">
                  <td class="py-2 font-mono text-xs">preloadDistance</td>
                  <td class="py-2">number</td>
                  <td class="py-2">100</td>
                  <td class="py-2">Pixels before viewport to start loading</td>
                </tr>
                <tr class="border-b border-default/50">
                  <td class="py-2 font-mono text-xs">keepMounted</td>
                  <td class="py-2">boolean</td>
                  <td class="py-2">true</td>
                  <td class="py-2">Keep content visible after first load</td>
                </tr>
                <tr class="border-b border-default/50">
                  <td class="py-2 font-mono text-xs">height</td>
                  <td class="py-2">number | string</td>
                  <td class="py-2">-</td>
                  <td class="py-2">Height hint to prevent layout shift</td>
                </tr>
                <tr class="border-b border-default/50">
                  <td class="py-2 font-mono text-xs">width</td>
                  <td class="py-2">number | string</td>
                  <td class="py-2">-</td>
                  <td class="py-2">Width hint to prevent layout shift</td>
                </tr>
                <tr class="border-b border-default/50">
                  <td class="py-2 font-mono text-xs">minPlaceholderTime</td>
                  <td class="py-2">number</td>
                  <td class="py-2">0</td>
                  <td class="py-2">Minimum ms to show placeholder (prevents flash)</td>
                </tr>
                <tr>
                  <td class="py-2 font-mono text-xs">transitionDuration</td>
                  <td class="py-2">number</td>
                  <td class="py-2">150</td>
                  <td class="py-2">Fade-in duration in ms</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </UAccordion>
    </template>
  </DemoLayout>
</template>
