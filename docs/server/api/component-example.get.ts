// @ts-expect-error - no types available
import components from '#component-example/nitro'
import { appendHeader, createError, defineEventHandler } from 'h3'
import { pascalCase } from 'scule'

export default defineEventHandler((event) => {
  appendHeader(event, 'Access-Control-Allow-Origin', '*')
  const componentName = (event.context.params?.['component?'] || '').replace(/\.json$/, '')
  if (componentName) {
    const component = components[pascalCase(componentName)]
    if (!component) {
      throw createError({
        statusMessage: 'Example not found!',
        statusCode: 404,
      })
    }
    return component
  }
})
