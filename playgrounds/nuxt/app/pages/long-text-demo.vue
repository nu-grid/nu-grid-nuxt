<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

const toast = useToast()
const table = useTemplateRef('table')

// Sample data with various long text scenarios
interface Article {
  id: number
  title: string
  summary: string
  description: string
  author: string
  tags: string
  status: string
}

const data = ref<Article[]>([
  {
    id: 1,
    title: 'Getting Started with Vue 3 Composition API',
    summary:
      'A comprehensive guide to understanding and using the Vue 3 Composition API for better code organization.',
    description:
      'The Vue 3 Composition API represents a significant evolution in how we structure Vue applications. This comprehensive guide walks you through the fundamental concepts including reactive references, computed properties, watchers, and lifecycle hooks.',
    author: 'Dr. Sarah Johnson-Williamson',
    tags: 'vue, javascript, composition-api, frontend, web-development, tutorial',
    status: 'Published',
  },
  {
    id: 2,
    title: 'Understanding TypeScript Generics in Depth',
    summary:
      'Master TypeScript generics with practical examples and real-world use cases for type-safe code.',
    description:
      'TypeScript generics enable you to write flexible, reusable code while maintaining strong type safety. This article covers everything from basic generic functions to advanced techniques.',
    author: 'Michael Chen',
    tags: 'typescript, generics, programming',
    status: 'Draft',
  },
  {
    id: 3,
    title: 'Building Scalable Microservices Architecture with Node.js and Kubernetes',
    summary:
      'Learn how to design, implement, and deploy microservices using Node.js, Docker containers, and Kubernetes orchestration.',
    description:
      'Microservices architecture has become the standard for building large-scale applications. This guide covers service decomposition, inter-service communication, API gateways, and more.',
    author: 'Alexandra Rodriguez-Martinez',
    tags: 'microservices, nodejs, kubernetes, docker, devops, architecture',
    status: 'In Review',
  },
  {
    id: 4,
    title: 'CSS Grid Layout',
    summary: 'Quick intro to CSS Grid.',
    description: 'CSS Grid basics.',
    author: 'Bob Smith',
    tags: 'css',
    status: 'Published',
  },
  {
    id: 5,
    title: 'Performance Optimization Strategies for Modern Web Applications',
    summary:
      'Discover techniques for optimizing web application performance including code splitting, lazy loading, and caching strategies.',
    description:
      'Web performance directly impacts user experience, SEO rankings, and conversion rates. This comprehensive guide explores bundle optimization, image optimization, and more.',
    author: 'Dr. Emily Richardson',
    tags: 'performance, optimization, web-vitals, lighthouse, caching',
    status: 'Published',
  },
  {
    id: 6,
    title: 'React Hooks Deep Dive',
    summary: 'Understanding useState, useEffect, and custom hooks.',
    description: 'A complete guide to React Hooks patterns.',
    author: 'Jane Doe',
    tags: 'react, hooks',
    status: 'Published',
  },
  {
    id: 7,
    title: 'GraphQL vs REST',
    summary: 'Comparing API paradigms.',
    description: 'When to use GraphQL and when REST is better.',
    author: 'John Smith',
    tags: 'api, graphql, rest',
    status: 'Draft',
  },
  {
    id: 8,
    title: 'Docker Fundamentals',
    summary: 'Container basics for developers.',
    description: 'Learn Docker from scratch with practical examples.',
    author: 'Alice Wong',
    tags: 'docker, devops',
    status: 'Published',
  },
  {
    id: 9,
    title: 'Testing Best Practices',
    summary: 'Unit, integration, and E2E testing strategies.',
    description: 'Comprehensive testing guide for modern applications.',
    author: 'Bob Johnson',
    tags: 'testing, jest, cypress',
    status: 'In Review',
  },
  {
    id: 10,
    title: 'State Management Patterns',
    summary: 'Redux, Zustand, and Pinia compared.',
    description: 'Choosing the right state management solution.',
    author: 'Carol Williams',
    tags: 'state, redux, pinia',
    status: 'Published',
  },
  {
    id: 11,
    title: 'Web Security Essentials',
    summary: 'Protecting your applications from common attacks.',
    description: 'XSS, CSRF, and SQL injection prevention.',
    author: 'David Brown',
    tags: 'security, owasp',
    status: 'Published',
  },
  {
    id: 12,
    title: 'Responsive Design Patterns',
    summary: 'Mobile-first CSS strategies.',
    description: 'Building layouts that work on any device.',
    author: 'Eve Davis',
    tags: 'css, responsive',
    status: 'Draft',
  },
  {
    id: 13,
    title: 'Git Workflow Strategies',
    summary: 'Branching models and collaboration.',
    description: 'GitFlow, trunk-based, and feature flags.',
    author: 'Frank Miller',
    tags: 'git, workflow',
    status: 'Published',
  },
  {
    id: 14,
    title: 'API Design Principles',
    summary: 'RESTful API best practices.',
    description: 'Designing APIs that developers love.',
    author: 'Grace Lee',
    tags: 'api, design',
    status: 'In Review',
  },
  {
    id: 15,
    title: 'Database Optimization',
    summary: 'Query performance and indexing.',
    description: 'Making your database queries fast.',
    author: 'Henry Wilson',
    tags: 'database, sql',
    status: 'Published',
  },
  {
    id: 16,
    title: 'CI/CD Pipeline Setup',
    summary: 'Automating deployments with GitHub Actions.',
    description: 'From commit to production automatically.',
    author: 'Ivy Chen',
    tags: 'cicd, github-actions',
    status: 'Published',
  },
  {
    id: 17,
    title: 'Accessibility Guidelines',
    summary: 'Building inclusive web applications.',
    description: 'WCAG compliance and screen reader support.',
    author: 'Jack Taylor',
    tags: 'a11y, accessibility',
    status: 'Draft',
  },
  {
    id: 18,
    title: 'WebSocket Real-time Apps',
    summary: 'Building live features with WebSockets.',
    description: 'Chat, notifications, and live updates.',
    author: 'Karen White',
    tags: 'websocket, realtime',
    status: 'Published',
  },
  {
    id: 19,
    title: 'Serverless Architecture',
    summary: 'AWS Lambda and cloud functions.',
    description: 'Building scalable serverless applications.',
    author: 'Leo Martinez',
    tags: 'serverless, aws',
    status: 'In Review',
  },
  {
    id: 20,
    title: 'Code Review Guidelines',
    summary: 'Effective code review practices.',
    description: 'How to give and receive constructive feedback.',
    author: 'Mia Anderson',
    tags: 'code-review, team',
    status: 'Published',
  },
  {
    id: 21,
    title: 'Monorepo Management',
    summary: 'Nx, Turborepo, and Lerna.',
    description: 'Managing multiple packages in one repo.',
    author: 'Noah Thomas',
    tags: 'monorepo, nx',
    status: 'Draft',
  },
  {
    id: 22,
    title: 'Error Handling Patterns',
    summary: 'Graceful error management.',
    description: 'Try-catch, error boundaries, and logging.',
    author: 'Olivia Jackson',
    tags: 'errors, patterns',
    status: 'Published',
  },
  {
    id: 23,
    title: 'Authentication Strategies',
    summary: 'JWT, OAuth, and session-based auth.',
    description: 'Securing your application access.',
    author: 'Peter Harris',
    tags: 'auth, jwt, oauth',
    status: 'Published',
  },
  {
    id: 24,
    title: 'Caching Strategies',
    summary: 'Redis, Memcached, and browser caching.',
    description: 'Speeding up your application with caches.',
    author: 'Quinn Clark',
    tags: 'caching, redis',
    status: 'In Review',
  },
  {
    id: 25,
    title: 'Logging Best Practices',
    summary: 'Structured logging and monitoring.',
    description: 'Making your logs useful for debugging.',
    author: 'Rachel Lewis',
    tags: 'logging, monitoring',
    status: 'Published',
  },
  {
    id: 26,
    title: 'Design Systems',
    summary: 'Building reusable component libraries.',
    description: 'Creating consistent UI across applications.',
    author: 'Sam Robinson',
    tags: 'design-system, components',
    status: 'Draft',
  },
  {
    id: 27,
    title: 'Performance Monitoring',
    summary: 'APM tools and metrics.',
    description: 'Tracking application performance in production.',
    author: 'Tina Walker',
    tags: 'apm, monitoring',
    status: 'Published',
  },
  {
    id: 28,
    title: 'Feature Flags',
    summary: 'Progressive feature rollouts.',
    description: 'Safely deploying new features.',
    author: 'Uma Hall',
    tags: 'feature-flags, deployment',
    status: 'Published',
  },
  {
    id: 29,
    title: 'API Versioning',
    summary: 'Managing breaking changes.',
    description: 'Strategies for evolving your API.',
    author: 'Victor Young',
    tags: 'api, versioning',
    status: 'In Review',
  },
  {
    id: 30,
    title: 'Load Testing',
    summary: 'Stress testing your application.',
    description: 'Finding performance limits before users do.',
    author: 'Wendy King',
    tags: 'testing, load',
    status: 'Published',
  },
  {
    id: 31,
    title: 'Microservices Communication',
    summary: 'Event-driven architecture patterns.',
    description: 'Message queues and event buses.',
    author: 'Xavier Scott',
    tags: 'microservices, events',
    status: 'Draft',
  },
  {
    id: 32,
    title: 'Data Validation',
    summary: 'Zod, Yup, and schema validation.',
    description: 'Ensuring data integrity at runtime.',
    author: 'Yuki Green',
    tags: 'validation, zod',
    status: 'Published',
  },
  {
    id: 33,
    title: 'Rate Limiting',
    summary: 'Protecting APIs from abuse.',
    description: 'Implementing rate limits and throttling.',
    author: 'Zara Adams',
    tags: 'api, security',
    status: 'Published',
  },
  {
    id: 34,
    title: 'Dependency Injection',
    summary: 'IoC containers and DI patterns.',
    description: 'Writing testable and maintainable code.',
    author: 'Alan Baker',
    tags: 'di, patterns',
    status: 'In Review',
  },
  {
    id: 35,
    title: 'Code Splitting',
    summary: 'Lazy loading and dynamic imports.',
    description: 'Reducing initial bundle size.',
    author: 'Beth Carter',
    tags: 'performance, webpack',
    status: 'Published',
  },
  {
    id: 36,
    title: 'Database Migrations',
    summary: 'Schema versioning strategies.',
    description: 'Managing database changes safely.',
    author: 'Chris Dixon',
    tags: 'database, migrations',
    status: 'Draft',
  },
  {
    id: 37,
    title: 'API Documentation',
    summary: 'OpenAPI and Swagger.',
    description: 'Creating useful API documentation.',
    author: 'Diana Evans',
    tags: 'api, docs',
    status: 'Published',
  },
  {
    id: 38,
    title: 'Internationalization',
    summary: 'i18n for global applications.',
    description: 'Supporting multiple languages and locales.',
    author: 'Eric Foster',
    tags: 'i18n, localization',
    status: 'Published',
  },
  {
    id: 39,
    title: 'Memory Management',
    summary: 'Avoiding memory leaks in JavaScript.',
    description: 'Profiling and fixing memory issues.',
    author: 'Fiona Grant',
    tags: 'performance, memory',
    status: 'In Review',
  },
  {
    id: 40,
    title: 'SSR vs SSG',
    summary: 'Server-side rendering strategies.',
    description: 'Choosing the right rendering approach.',
    author: 'George Hill',
    tags: 'ssr, ssg, nextjs',
    status: 'Published',
  },
  {
    id: 41,
    title: 'Web Workers',
    summary: 'Offloading work to background threads.',
    description: 'Improving UI responsiveness with workers.',
    author: 'Hannah Irving',
    tags: 'workers, performance',
    status: 'Draft',
  },
  {
    id: 42,
    title: 'Progressive Web Apps',
    summary: 'Building installable web apps.',
    description: 'Service workers and offline support.',
    author: 'Ian James',
    tags: 'pwa, offline',
    status: 'Published',
  },
  {
    id: 43,
    title: 'Edge Computing',
    summary: 'Running code at the edge.',
    description: 'Cloudflare Workers and Vercel Edge.',
    author: 'Julia Kelly',
    tags: 'edge, serverless',
    status: 'Published',
  },
  {
    id: 44,
    title: 'Container Orchestration',
    summary: 'Kubernetes in production.',
    description: 'Managing containerized applications at scale.',
    author: 'Kevin Long',
    tags: 'kubernetes, containers',
    status: 'In Review',
  },
  {
    id: 45,
    title: 'Event Sourcing',
    summary: 'Storing state as events.',
    description: 'Building event-sourced applications.',
    author: 'Laura Moore',
    tags: 'events, architecture',
    status: 'Published',
  },
])

const editingEnabled = ref(true)
const wrapTextEnabled = ref(false)
const cmdArrows = ref<'paging' | 'firstlast'>('paging')

const { focusMode, toggleFocusMode, focusModeIcon, focusModeLabel, focusModeStatus } =
  useFocusModeToggle()

// Use computed columns to allow dynamic wrapText toggling
const columns = computed<NuGridColumn<Article>[]>(() => [
  {
    accessorKey: 'id',
    header: 'ID',
    minSize: 50,
    size: 60,
    enableEditing: false,
    enableFocusing: false,
    cellDataType: 'number',
  },
  { accessorKey: 'title', header: 'Title', minSize: 150, size: 200, cellDataType: 'text' },
  {
    accessorKey: 'summary',
    header: 'Summary',
    minSize: 150,
    size: 250,
    cellDataType: 'text',
    wrapText: true,
  },
  {
    accessorKey: 'description',
    header: 'Full Description',
    minSize: 200,
    size: 300,
    cellDataType: 'textarea',
    wrapText: true,
  },
  { accessorKey: 'author', header: 'Author', minSize: 100, size: 150, cellDataType: 'text' },
  { accessorKey: 'tags', header: 'Tags', minSize: 100, size: 180, cellDataType: 'text' },
  { accessorKey: 'status', header: 'Status', minSize: 80, size: 100, cellDataType: 'text' },
])

const columnVisibility = ref()
const selectedRows = ref({})
const columnSizing = ref({})
const columnPinning = ref({})

function onCellValueChanged(event: { row: any; column: any; oldValue: any; newValue: any }) {
  const columnLabel = event.column.header || event.column.id
  toast.add({
    title: 'Cell Value Changed',
    description: `${columnLabel}: Updated successfully`,
    color: 'success',
  })
}

const exampleCode = `// Grid-level default
<NuGrid
  :column-defaults="{ wrapText: true }"
  ...
/>

// Column-level override
const columns = [
  {
    accessorKey: 'description',
    header: 'Description',
    wrapText: true,
    cellDataType: 'textarea', // Multi-line editor
  }
]`
</script>

<template>
  <DemoLayout
    id="long-text-demo"
    title="Long Text Handling Demo"
    info-label="About Long Text Handling"
  >
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem
        label="Editing"
        :value="editingEnabled ? 'Enabled' : 'Disabled'"
        :color="editingEnabled ? 'text-success' : 'text-error'"
      />
      <DemoStatusItem
        label="Wrap Text"
        :value="wrapTextEnabled ? 'On' : 'Off'"
        :color="wrapTextEnabled ? 'text-primary' : 'text-muted'"
      />
      <DemoStatusItem label="Focus Mode" :value="focusModeLabel" />
      <DemoStatusItem label="Cmd+Arrows" :value="cmdArrows === 'paging' ? 'Page' : 'First/Last'" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Editing">
        <UButton
          block
          :color="editingEnabled ? 'success' : 'neutral'"
          :variant="editingEnabled ? 'solid' : 'outline'"
          :icon="editingEnabled ? 'i-lucide-pencil' : 'i-lucide-pencil-off'"
          size="sm"
          @click="editingEnabled = !editingEnabled"
        >
          {{ editingEnabled ? 'Enabled' : 'Disabled' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Wrap Text (Default)">
        <UButton
          block
          :color="wrapTextEnabled ? 'primary' : 'neutral'"
          :variant="wrapTextEnabled ? 'solid' : 'outline'"
          icon="i-lucide-wrap-text"
          size="sm"
          @click="wrapTextEnabled = !wrapTextEnabled"
        >
          {{ wrapTextEnabled ? 'Enabled' : 'Disabled' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Focus Mode">
        <UButton
          block
          color="neutral"
          variant="outline"
          :icon="focusModeIcon"
          :aria-label="focusModeStatus"
          size="sm"
          @click="toggleFocusMode"
        >
          {{ focusModeLabel }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Cmd+Arrows">
        <UButton
          block
          :color="cmdArrows === 'paging' ? 'primary' : 'neutral'"
          :variant="cmdArrows === 'paging' ? 'solid' : 'outline'"
          :icon="cmdArrows === 'paging' ? 'i-lucide-chevrons-up-down' : 'i-lucide-chevrons-down-up'"
          size="sm"
          @click="cmdArrows = cmdArrows === 'paging' ? 'firstlast' : 'paging'"
        >
          {{ cmdArrows === 'paging' ? 'Page' : 'First/Last' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Column Pinning">
        <NuGridColumnPinningControl :grid-ref="table" />
      </DemoControlGroup>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        This page demonstrates the
        <code class="rounded bg-default px-1 py-0.5 text-xs">wrapText</code>
        option for NuGrid columns.
      </p>
      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-muted">
        <strong>wrapText Option:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li>
            <strong>Grid-level:</strong> Set via
            <code class="rounded bg-default px-1 py-0.5 text-xs">columnDefaults.wrapText</code>
          </li>
          <li>
            <strong>Column-level:</strong> Set
            <code class="rounded bg-default px-1 py-0.5 text-xs">wrapText: true</code> on individual
            columns
          </li>
          <li>Column-level settings take precedence over grid defaults</li>
        </ul>
      </div>
      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Demo Setup:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li><strong>Summary:</strong> Always wraps (column override)</li>
          <li><strong>Description:</strong> Wraps with textarea editor</li>
          <li><strong>Other columns:</strong> Follow grid default</li>
        </ul>
      </div>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Textarea Editor Keys:</strong>
        <ul class="mt-1 list-inside list-disc">
          <li>Enter creates a new line</li>
          <li>Cmd/Ctrl+Enter saves and exits</li>
          <li>Tab/Shift+Tab navigates cells</li>
        </ul>
      </div>
    </template>

    <!-- Grid -->
    <NuGrid
      ref="table"
      v-model:column-visibility="columnVisibility"
      v-model:selected-rows="selectedRows"
      v-model:column-sizing="columnSizing"
      v-model:column-pinning="columnPinning"
      :editing="{ enabled: editingEnabled, startKeys: 'all', startClicks: 'double' }"
      :focus="{ mode: focusMode, cmdArrows }"
      :layout="{ mode: 'div', stickyHeaders: true }"
      :column-defaults="{ wrapText: wrapTextEnabled }"
      resize-columns
      reorder-columns
      :data="data"
      :columns="columns"
      @cell-value-changed="onCellValueChanged"
    />

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Wrap Text Configuration:" :code="exampleCode" />
    </template>

    <!-- Extra: Test Scenarios -->
    <template #extra>
      <UAccordion :items="[{ label: 'Test Scenarios', icon: 'i-lucide-test-tube', slot: 'test' }]">
        <template #test>
          <div class="space-y-2 p-4 text-sm text-muted">
            <p><strong>Try these:</strong></p>
            <ul class="list-inside list-disc space-y-1">
              <li>Toggle "Wrap Text" to change grid default</li>
              <li>Notice Summary & Description always wrap</li>
              <li>Resize columns to see text reflow</li>
              <li>Hover over truncated cells for tooltip</li>
            </ul>
          </div>
        </template>
      </UAccordion>
    </template>
  </DemoLayout>
</template>

<style scoped>
code {
  font-family: 'Monaco', 'Courier New', monospace;
}
</style>
