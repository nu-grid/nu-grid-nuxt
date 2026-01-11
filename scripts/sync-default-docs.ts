#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import url from 'node:url'
import vm from 'node:vm'
import ts from 'typescript'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const configDefaultsPath = path.join(root, 'src/runtime/config/options-defaults.ts')
const optionGroupsPath = path.join(root, 'src/runtime/types/option-groups.ts')
const virtualizationTypesPath = path.join(root, 'src/runtime/types/virtualization.ts')

type UnknownRecord = Record<string, unknown>

const interfaceBasePath: Record<string, string> = {
  NuGridFocusOptions: 'focus',
  NuGridEditingOptions: 'editing',
  NuGridValidationOptions: 'validation',
  NuGridSelectionOptions: 'selection',
  NuGridLayoutOptions: 'layout',
  NuGridTooltipOptions: 'tooltip',
  NuGridAnimationOptions: 'animation',
  NuGridVirtualizerOptions: 'virtualizationDefaults',
  GroupingVirtualRowHeights: 'groupRowHeightsDefaults',
}

function loadDefaults(filePath: string): UnknownRecord & {
  nuGridVirtualizationDefaults?: UnknownRecord
  nuGridGroupRowHeightDefaults?: UnknownRecord
} {
  const source = fs.readFileSync(filePath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText

  const sandbox: { module: { exports: UnknownRecord }; exports: UnknownRecord } = {
    module: { exports: {} },
    exports: {},
  }
  vm.runInNewContext(transpiled, sandbox, { filename: filePath })
  const defaults =
    sandbox.module?.exports?.nuGridDefaults ?? sandbox.exports?.nuGridDefaults ?? null
  if (!defaults) {
    throw new Error('nuGridDefaults not found after transpile')
  }
  return defaults as UnknownRecord & {
    nuGridVirtualizationDefaults?: UnknownRecord
    nuGridGroupRowHeightDefaults?: UnknownRecord
  }
}

function flattenDefaults(
  obj: UnknownRecord,
  prefix = '',
  out: Map<string, unknown> = new Map<string, unknown>(),
): Map<string, unknown> {
  Object.entries(obj).forEach(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenDefaults(value as UnknownRecord, nextKey, out)
    } else {
      out.set(nextKey, value)
    }
  })
  return out
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return `'${value}'`
  if (value === undefined) return 'undefined'
  return JSON.stringify(value)
}

function syncDefaultValues(): void {
  const defaults = loadDefaults(configDefaultsPath)
  const flatDefaults = flattenDefaults(defaults)

  // Pull in additional default buckets for virtualization types
  const virtualizationDefaults = flattenDefaults(
    defaults.nuGridVirtualizationDefaults ?? {},
    'virtualizationDefaults',
  )
  const groupRowHeightsDefaults = flattenDefaults(
    defaults.nuGridGroupRowHeightDefaults ?? {},
    'groupRowHeightsDefaults',
  )

  const flat = new Map<string, unknown>([
    ...flatDefaults,
    ...virtualizationDefaults,
    ...groupRowHeightsDefaults,
  ])

  const optionGroupLines = fs.readFileSync(optionGroupsPath, 'utf8').split(/\r?\n/)
  const virtualizationLines = fs.readFileSync(virtualizationTypesPath, 'utf8').split(/\r?\n/)
  const files: Array<{ lines: string[]; path: string }> = [
    { lines: optionGroupLines, path: optionGroupsPath },
    { lines: virtualizationLines, path: virtualizationTypesPath },
  ]
  let currentInterface: string | null = null
  let updated = 0

  for (const file of files) {
    currentInterface = null
    for (let i = 0; i < file.lines.length; i++) {
      const line = file.lines[i]
      if (!line) continue

      const ifaceMatch = line.match(/export interface (\w+)/)
      if (ifaceMatch) {
        currentInterface = ifaceMatch[1] ?? null
      }

      if (!line.includes('@defaultValue')) continue

      // Find the upcoming property line
      let propLineIndex = i + 1
      let propName: string | null = null
      while (propLineIndex < file.lines.length) {
        const candidate = file.lines[propLineIndex]
        if (!candidate) {
          propLineIndex++
          continue
        }
        const match = candidate.match(/\s*(\w+)\??:\s*/)
        if (match) {
          propName = match[1] ?? null
          break
        }
        if (candidate.trim().startsWith('* @defaultValue')) {
          // another default without property; bail
          break
        }
        propLineIndex++
      }

      if (!propName || !currentInterface) continue

      const base = interfaceBasePath[currentInterface]
      if (!base) continue

      const defaultKey = `${base}.${propName}`
      if (!flat.has(defaultKey)) continue

      const newValue = formatValue(flat.get(defaultKey))
      const newLine = line.replace(/@defaultValue\s+.*/, `@defaultValue ${newValue}`)
      if (newLine !== line) {
        file.lines[i] = newLine
        updated++
      }
    }

    fs.writeFileSync(file.path, file.lines.join('\n'))
  }

  console.log(`Updated ${updated} @defaultValue entries from nuGrid defaults`)
}

try {
  syncDefaultValues()
} catch (err) {
  console.error(err)
  process.exitCode = 1
}
