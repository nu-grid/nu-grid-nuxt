import { defineNuxtPlugin, useAppConfig } from '#app'
import { createNuGridTheme, registerTheme } from './themes'

/**
 * NuGrid plugin - registers custom themes from app.config.ts
 */
export default defineNuxtPlugin(() => {
  const appConfig = useAppConfig()
  const customThemes = (appConfig as any).nuGrid?.themes || []

  // Register each custom theme from app config
  for (const themeConfig of customThemes) {
    const theme = createNuGridTheme(themeConfig)
    registerTheme(theme)
  }
})
