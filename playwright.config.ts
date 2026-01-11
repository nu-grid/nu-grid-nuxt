import type { ConfigOptions } from '@nuxt/test-utils/playwright'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for NuGrid E2E tests.
 * See https://playwright.dev/docs/test-configuration.
 * Follows Nuxt 4 recommendations: https://nuxt.com/docs/4.x/getting-started/testing
 */
export default defineConfig<ConfigOptions>({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Limit workers to avoid multiple parallel Nuxt builds competing for resources */
  workers: process.env.CI ? 1 : 3,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Generous timeout for Nuxt build process - first test in each worker needs build time */
  timeout: 120000,
  /* Expect timeout for assertions */
  expect: {
    timeout: 10000,
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Nuxt-specific configuration */
    nuxt: {
      rootDir: fileURLToPath(new URL('./playgrounds/nuxt', import.meta.url)),
    },
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
