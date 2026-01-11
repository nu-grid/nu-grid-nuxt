import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineVitestConfig({
  test: {
    globals: true,
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        rootDir: fileURLToPath(new URL('./playgrounds/nuxt', import.meta.url)),
        domEnvironment: 'happy-dom',
      },
    },
    // Use absolute path for root to ensure test discovery works correctly
    root: rootDir,
    // Restrict discovery to our test folder to avoid walking node_modules or workspace deps
    include: ['test/**/*.{test,spec}.ts'],
    setupFiles: [fileURLToPath(new URL('./test/setup.ts', import.meta.url))],
    exclude: ['**/node_modules/**', 'dist', '.idea', '.git', '.cache', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/', '.nuxt/', '*.config.*', 'src/runtime/types/**', 'e2e/'],
    },
  },
})
