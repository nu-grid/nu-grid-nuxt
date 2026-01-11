/**
 * Standard Schema v1 utilities for NuGrid validation
 * @see https://standardschema.dev
 */

import type { NuGridValidationResult } from '../types/cells'

// Re-export for backwards compatibility
export type { NuGridValidationResult }

/**
 * Standard Schema v1 interfaces
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': StandardSchemaV1Props<Input, Output>
}

export interface StandardSchemaV1Props<Input = unknown, Output = Input> {
  readonly version: 1
  readonly vendor: string
  readonly validate: (
    value: unknown,
    options?: StandardSchemaV1Options | undefined,
  ) => StandardSchemaV1Result<Output> | Promise<StandardSchemaV1Result<Output>>
  readonly types?: {
    readonly input: Input
    readonly output: Output
  }
}

export interface StandardSchemaV1Options {
  /** Explicit support for additional vendor-specific parameters, if needed. */
  readonly libraryOptions?: Record<string, unknown> | undefined
}

export type StandardSchemaV1Result<Output> =
  | StandardSchemaV1SuccessResult<Output>
  | StandardSchemaV1FailureResult

export interface StandardSchemaV1SuccessResult<Output> {
  readonly value: Output
  readonly issues?: undefined
}

export interface StandardSchemaV1FailureResult {
  readonly issues: ReadonlyArray<StandardSchemaV1Issue>
}

export interface StandardSchemaV1Issue {
  readonly message: string
  readonly path?: ReadonlyArray<PropertyKey | StandardSchemaV1PathSegment> | undefined
}

export interface StandardSchemaV1PathSegment {
  readonly key: PropertyKey
}

/**
 * Type inference helpers
 */
export type InferInput<Schema extends StandardSchemaV1> = NonNullable<
  Schema['~standard']['types']
>['input']

export type InferOutput<Schema extends StandardSchemaV1> = NonNullable<
  Schema['~standard']['types']
>['output']

/**
 * Split a path string like "foo.bar.baz" or "foo[0].bar" into segments
 */
export function splitPath(path: string): (string | number)[] {
  if (!path) return []

  const segments: (string | number)[] = []
  let current = ''
  let i = 0

  while (i < path.length) {
    const char = path[i]

    if (char === '.') {
      if (current) {
        segments.push(current)
        current = ''
      }
      i++
    } else if (char === '[') {
      if (current) {
        segments.push(current)
        current = ''
      }
      i++
      // Parse bracket content
      let bracketContent = ''
      while (i < path.length && path[i] !== ']') {
        bracketContent += path[i]
        i++
      }
      // Skip closing bracket
      if (i < path.length) i++

      // Check if numeric index
      const numIndex = Number.parseInt(bracketContent, 10)
      if (!Number.isNaN(numIndex) && String(numIndex) === bracketContent) {
        segments.push(numIndex)
      } else {
        // String key (strip quotes if present)
        segments.push(bracketContent.replace(/^['"]|['"]$/g, ''))
      }
    } else {
      current += char
      i++
    }
  }

  if (current) {
    segments.push(current)
  }

  return segments
}

/**
 * Get a value at a path from an object
 */
export function getValueAtPath(obj: any, path: (string | number)[]): any {
  let current = obj
  for (const segment of path) {
    if (current == null) return undefined
    current = current[segment]
  }
  return current
}

/**
 * Set a value at a path in an object, returning a new object
 */
export function setValueAtPath<T extends Record<string, any>>(
  obj: T,
  path: (string | number)[],
  value: any,
): T {
  if (path.length === 0) return value as T

  const result = Array.isArray(obj) ? [...obj] : { ...obj }
  let current: any = result
  const lastIndex = path.length - 1

  for (let i = 0; i < lastIndex; i++) {
    const segment = path[i] as string | number
    const nextSegment = path[i + 1]

    if (current[segment] == null) {
      // Create appropriate container based on next segment type
      current[segment] = typeof nextSegment === 'number' ? [] : {}
    } else {
      // Clone to maintain immutability
      current[segment] = Array.isArray(current[segment])
        ? [...current[segment]]
        : { ...current[segment] }
    }
    current = current[segment]
  }

  const lastSegment = path[lastIndex] as string | number
  current[lastSegment] = value
  return result as T
}

/**
 * Check if a schema is a Standard Schema v1
 */
export function isStandardSchema(schema: unknown): schema is StandardSchemaV1 {
  return (
    schema != null
    && typeof schema === 'object'
    && '~standard' in schema
    && typeof (schema as any)['~standard']?.validate === 'function'
  )
}

/**
 * Convert a schema validation result to NuGridValidationResult
 */
function toNuGridResult(result: StandardSchemaV1Result<unknown>): NuGridValidationResult {
  if (result.issues && result.issues.length > 0) {
    return {
      valid: false,
      message: result.issues[0]?.message || 'Validation failed',
      issues: result.issues as StandardSchemaV1Issue[],
    }
  }
  return { valid: true }
}

/**
 * Validate a value against a Standard Schema
 * Returns a normalized result suitable for NuGrid
 * Supports both sync and async schema validation
 */
export function validateStandardValue<T>(
  schema: StandardSchemaV1<T>,
  value: unknown,
): NuGridValidationResult | Promise<NuGridValidationResult> {
  try {
    const result = schema['~standard'].validate(value)

    // Handle async validation
    if (result instanceof Promise) {
      return result.then(toNuGridResult).catch((error) => ({
        valid: false,
        message: error instanceof Error ? error.message : 'Validation error',
      }))
    }

    // Handle sync validation
    return toNuGridResult(result)
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error ? error.message : 'Validation error',
    }
  }
}

/**
 * Filter issues to find ones relevant to a specific field path
 */
function filterIssuesForField(
  issues: ReadonlyArray<StandardSchemaV1Issue>,
  fieldPath: (string | number)[],
): StandardSchemaV1Issue[] {
  const fieldPathStr = fieldPath.join('.')
  return issues.filter((issue) => {
    if (!issue.path || issue.path.length === 0) return false
    const issuePath = issue.path
      .map((p) => (typeof p === 'object' && 'key' in p ? p.key : p))
      .join('.')
    return issuePath === fieldPathStr || issuePath.startsWith(`${fieldPathStr}.`)
  })
}

/**
 * Process validation result to find field-specific errors
 */
function processFieldValidationResult(
  result: NuGridValidationResult,
  fieldPath: (string | number)[],
): NuGridValidationResult {
  if (!result.valid && result.issues) {
    const relevantIssues = filterIssuesForField(result.issues, fieldPath)

    if (relevantIssues.length > 0) {
      return {
        valid: false,
        message: relevantIssues[0]?.message || 'Validation failed',
        issues: relevantIssues,
      }
    }

    // If there are issues but not for this field, the field itself is valid
    return { valid: true }
  }

  return result
}

/**
 * Validate a single field value against a schema
 * This validates the entire row with the candidate value and filters to field-specific errors
 * Supports both sync and async schema validation
 */
export function validateFieldValue<T>(
  schema: StandardSchemaV1<T>,
  fieldPath: (string | number)[],
  value: unknown,
  fullRowData?: Record<string, any>,
): NuGridValidationResult | Promise<NuGridValidationResult> {
  // If we have full row data, validate the entire row with the candidate value
  if (fullRowData) {
    const candidateRow = setValueAtPath(fullRowData, fieldPath, value)
    const result = validateStandardValue(schema, candidateRow)

    // Handle async result
    if (result instanceof Promise) {
      return result.then((r) => processFieldValidationResult(r, fieldPath))
    }

    // Handle sync result
    return processFieldValidationResult(result, fieldPath)
  }

  // Without row data, we can only validate the value directly
  return validateStandardValue(schema, value)
}

/**
 * Format validation issues into a user-friendly message
 */
export function formatStandardSchemaIssues(issues: StandardSchemaV1Issue[]): string {
  if (!issues || issues.length === 0) return 'Validation failed'

  return issues
    .map((issue) => {
      if (issue.path && issue.path.length > 0) {
        const pathStr = issue.path
          .map((p) => (typeof p === 'object' && 'key' in p ? p.key : p))
          .join('.')
        return `${pathStr}: ${issue.message}`
      }
      return issue.message
    })
    .join('; ')
}
