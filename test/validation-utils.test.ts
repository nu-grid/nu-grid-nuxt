import type {
  NuGridValidationResult,
  StandardSchemaV1,
  StandardSchemaV1Issue,
} from '../src/runtime/utils/standardSchema'
import { describe, expect, it } from 'vitest'
import {
  formatStandardSchemaIssues,
  getValueAtPath,
  isStandardSchema,
  setValueAtPath,
  splitPath,
  validateFieldValue,
  validateStandardValue,
} from '../src/runtime/utils/standardSchema'

function makeSchema(
  validate: (
    val: any,
  ) =>
    | NuGridValidationResult
    | { value: any; issues?: undefined }
    | Promise<NuGridValidationResult | { value: any; issues?: undefined }>,
): StandardSchemaV1<any> {
  return {
    '~standard': {
      version: 1,
      vendor: 'test',
      validate,
    },
  } as StandardSchemaV1<any>
}

describe('standardSchema utils', () => {
  describe('splitPath', () => {
    it('splits dot paths', () => {
      expect(splitPath('foo.bar.baz')).toEqual(['foo', 'bar', 'baz'])
    })

    it('splits bracket notation with numeric indices', () => {
      expect(splitPath('items[0]')).toEqual(['items', 0])
      expect(splitPath('foo[1][2]')).toEqual(['foo', 1, 2])
    })

    it('splits mixed dot and bracket paths', () => {
      expect(splitPath('foo.bar[0].baz')).toEqual(['foo', 'bar', 0, 'baz'])
      expect(splitPath('users[0].addresses[1].city')).toEqual(['users', 0, 'addresses', 1, 'city'])
    })

    it('handles string keys in brackets', () => {
      expect(splitPath("a['b'].c")).toEqual(['a', 'b', 'c'])
      expect(splitPath('a["key"].value')).toEqual(['a', 'key', 'value'])
    })

    it('handles mixed quoted and numeric bracket notation', () => {
      expect(splitPath("a['b'].c[2]")).toEqual(['a', 'b', 'c', 2])
    })

    it('handles deeply nested paths', () => {
      expect(splitPath('a.b.c.d.e.f')).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
    })

    it('handles empty string', () => {
      expect(splitPath('')).toEqual([])
    })

    it('handles single segment', () => {
      expect(splitPath('foo')).toEqual(['foo'])
    })

    it('handles consecutive brackets', () => {
      expect(splitPath('[0][1][2]')).toEqual([0, 1, 2])
    })

    it('handles bracket at start', () => {
      expect(splitPath('[0].value')).toEqual([0, 'value'])
    })

    it('handles path ending with bracket', () => {
      expect(splitPath('items[0]')).toEqual(['items', 0])
    })

    it('handles unquoted string in brackets', () => {
      expect(splitPath('a[key].b')).toEqual(['a', 'key', 'b'])
    })
  })

  describe('getValueAtPath', () => {
    it('gets simple property value', () => {
      const obj = { name: 'John' }
      expect(getValueAtPath(obj, ['name'])).toBe('John')
    })

    it('gets nested property value', () => {
      const obj = { user: { profile: { name: 'John' } } }
      expect(getValueAtPath(obj, ['user', 'profile', 'name'])).toBe('John')
    })

    it('gets array element', () => {
      const obj = { items: ['a', 'b', 'c'] }
      expect(getValueAtPath(obj, ['items', 1])).toBe('b')
    })

    it('gets nested array element', () => {
      const obj = { users: [{ name: 'John' }, { name: 'Jane' }] }
      expect(getValueAtPath(obj, ['users', 1, 'name'])).toBe('Jane')
    })

    it('returns undefined for missing path', () => {
      const obj = { name: 'John' }
      expect(getValueAtPath(obj, ['missing'])).toBeUndefined()
    })

    it('returns undefined for null in path', () => {
      const obj = { user: null }
      expect(getValueAtPath(obj, ['user', 'name'])).toBeUndefined()
    })

    it('returns undefined for undefined in path', () => {
      const obj = { user: undefined }
      expect(getValueAtPath(obj, ['user', 'name'])).toBeUndefined()
    })

    it('returns object itself for empty path', () => {
      const obj = { name: 'John' }
      expect(getValueAtPath(obj, [])).toEqual({ name: 'John' })
    })

    it('handles deeply nested arrays', () => {
      const obj = { a: [{ b: [{ c: 'value' }] }] }
      expect(getValueAtPath(obj, ['a', 0, 'b', 0, 'c'])).toBe('value')
    })
  })

  describe('setValueAtPath', () => {
    it('sets simple property value', () => {
      const obj = { name: 'John' }
      const result = setValueAtPath(obj, ['name'], 'Jane')
      expect(result).toEqual({ name: 'Jane' })
      expect(obj.name).toBe('John') // Original unchanged
    })

    it('sets nested property value', () => {
      const obj = { user: { name: 'John' } }
      const result = setValueAtPath(obj, ['user', 'name'], 'Jane')
      expect(result).toEqual({ user: { name: 'Jane' } })
      expect(obj.user.name).toBe('John') // Original unchanged
    })

    it('sets array element', () => {
      const obj = { items: ['a', 'b', 'c'] }
      const result = setValueAtPath(obj, ['items', 1], 'x')
      expect(result).toEqual({ items: ['a', 'x', 'c'] })
      expect(obj.items[1]).toBe('b') // Original unchanged
    })

    it('creates missing intermediate objects', () => {
      const obj: any = {}
      const result = setValueAtPath(obj, ['user', 'profile', 'name'], 'John')
      expect(result).toEqual({ user: { profile: { name: 'John' } } })
    })

    it('creates missing intermediate arrays', () => {
      const obj: any = {}
      const result = setValueAtPath(obj, ['items', 0, 'name'], 'Item')
      expect(result).toEqual({ items: [{ name: 'Item' }] })
    })

    it('returns value directly for empty path', () => {
      const result = setValueAtPath({} as any, [], 'value')
      expect(result).toBe('value')
    })

    it('maintains immutability for nested objects', () => {
      const obj = { a: { b: { c: 1 } } }
      const result = setValueAtPath(obj, ['a', 'b', 'c'], 2)
      expect(obj.a.b.c).toBe(1)
      expect(result.a.b.c).toBe(2)
      expect(obj.a).not.toBe(result.a)
      expect(obj.a.b).not.toBe(result.a.b)
    })

    it('maintains immutability for arrays', () => {
      const obj = { items: [1, 2, 3] }
      const result = setValueAtPath(obj, ['items', 1], 99)
      expect(obj.items).not.toBe(result.items)
      expect(obj.items[1]).toBe(2)
      expect(result.items[1]).toBe(99)
    })
  })

  describe('isStandardSchema', () => {
    it('returns true for valid Standard Schema', () => {
      const schema = makeSchema(() => ({ valid: true }))
      expect(isStandardSchema(schema)).toBe(true)
    })

    it('returns false for null', () => {
      expect(isStandardSchema(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isStandardSchema(undefined)).toBe(false)
    })

    it('returns false for plain object without ~standard', () => {
      expect(isStandardSchema({ validate: () => {} })).toBe(false)
    })

    it('returns false for object with ~standard but no validate function', () => {
      expect(isStandardSchema({ '~standard': { version: 1 } })).toBe(false)
    })

    it('returns false for non-object', () => {
      expect(isStandardSchema('string')).toBe(false)
      expect(isStandardSchema(123)).toBe(false)
      expect(isStandardSchema(() => {})).toBe(false)
    })

    it('returns true for schema with all required properties', () => {
      const schema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: () => ({ value: true }),
        },
      }
      expect(isStandardSchema(schema)).toBe(true)
    })
  })

  describe('validateStandardValue', () => {
    it('returns valid result for passing validation', () => {
      const schema = makeSchema(() => ({ value: 'test' }))
      const result = validateStandardValue(schema, 'test')
      expect(result).toEqual({ valid: true })
    })

    it('returns invalid result with message for failing validation', () => {
      const schema = makeSchema(() => ({
        valid: false,
        issues: [{ message: 'Value is required' }],
      }))
      const result = validateStandardValue(schema, '')
      expect(result).toEqual({
        valid: false,
        message: 'Value is required',
        issues: [{ message: 'Value is required' }],
      })
    })

    it('returns first issue message when multiple issues', () => {
      const schema = makeSchema(() => ({
        valid: false,
        issues: [{ message: 'First error' }, { message: 'Second error' }],
      }))
      const result = validateStandardValue(schema, '')
      expect((result as NuGridValidationResult).message).toBe('First error')
    })

    it('handles async validation success', async () => {
      const schema = makeSchema(async () => ({ value: 'test' }))
      const result = await validateStandardValue(schema, 'test')
      expect(result).toEqual({ valid: true })
    })

    it('handles async validation failure', async () => {
      const schema = makeSchema(async () => ({
        valid: false,
        issues: [{ message: 'Async error' }],
      }))
      const result = await validateStandardValue(schema, 'bad')
      expect(result).toEqual({
        valid: false,
        message: 'Async error',
        issues: [{ message: 'Async error' }],
      })
    })

    it('handles async validation rejection', async () => {
      const schema = makeSchema(async () => {
        throw new Error('Validation threw')
      })
      const result = await validateStandardValue(schema, 'test')
      expect(result).toEqual({
        valid: false,
        message: 'Validation threw',
      })
    })

    it('handles sync validation exception', () => {
      const schema = makeSchema(() => {
        throw new Error('Sync error')
      })
      const result = validateStandardValue(schema, 'test')
      expect(result).toEqual({
        valid: false,
        message: 'Sync error',
      })
    })

    it('handles non-Error exception', () => {
      const schema = makeSchema(() => {
        // eslint-disable-next-line no-throw-literal
        throw 'string error'
      })
      const result = validateStandardValue(schema, 'test')
      expect(result).toEqual({
        valid: false,
        message: 'Validation error',
      })
    })
  })

  describe('validateFieldValue', () => {
    it('validates field with row data and surfaces field-specific issue', () => {
      const schema = makeSchema((_row) => ({
        valid: false,
        issues: [
          { message: 'bad email', path: ['email'] },
          { message: 'other', path: ['name'] },
        ],
      }))

      const result = validateFieldValue(schema, ['email'], 'oops', {
        name: 'x',
        email: 'ok',
      })
      expect((result as NuGridValidationResult).valid).toBe(false)
      expect((result as NuGridValidationResult).message).toBe('bad email')
    })

    it('treats unrelated issues as valid for the field', () => {
      const schema = makeSchema((_row) => ({
        valid: false,
        issues: [{ message: 'name required', path: ['name'] }],
      }))

      const result = validateFieldValue(schema, ['email'], 'a@b.com', {
        name: '',
        email: 'a@b.com',
      })
      expect((result as NuGridValidationResult).valid).toBe(true)
    })

    it('supports async validation and maps first issue', async () => {
      const schema = makeSchema(async () => ({
        valid: false,
        issues: [{ message: 'async fail', path: ['email'] }],
      }))

      const result = await validateFieldValue(schema, ['email'], 'nope', {
        email: 'nope',
      })
      expect(result.valid).toBe(false)
      expect(result.message).toBe('async fail')
    })

    it('validates directly when no row data provided', () => {
      const schema = makeSchema((val) => {
        if (val === 'invalid') {
          return { valid: false, issues: [{ message: 'Invalid value' }] }
        }
        return { value: val }
      })

      const result = validateFieldValue(schema, ['value'], 'invalid')
      expect((result as NuGridValidationResult).valid).toBe(false)
    })

    it('creates candidate row with updated field value', () => {
      let receivedRow: any
      const schema = makeSchema((row) => {
        receivedRow = row
        return { value: row }
      })

      validateFieldValue(schema, ['email'], 'newemail@test.com', {
        name: 'John',
        email: 'old@test.com',
      })

      expect(receivedRow).toEqual({
        name: 'John',
        email: 'newemail@test.com',
      })
    })

    it('handles nested field paths', () => {
      const schema = makeSchema((_row) => ({
        valid: false,
        issues: [{ message: 'nested error', path: ['user', 'profile', 'email'] }],
      }))

      const result = validateFieldValue(schema, ['user', 'profile', 'email'], 'bad', {
        user: { profile: { email: 'good' } },
      })

      expect((result as NuGridValidationResult).valid).toBe(false)
      expect((result as NuGridValidationResult).message).toBe('nested error')
    })

    it('matches path prefix for nested issues', () => {
      const schema = makeSchema((_row) => ({
        valid: false,
        issues: [{ message: 'user.name error', path: ['user', 'name', 'first'] }],
      }))

      // Field is 'user.name', issue is for 'user.name.first' - should match as child
      const result = validateFieldValue(
        schema,
        ['user', 'name'],
        { first: '' },
        {
          user: { name: { first: '' } },
        },
      )

      expect((result as NuGridValidationResult).valid).toBe(false)
    })

    it('handles issues with path segment objects', () => {
      const schema = makeSchema((_row) => ({
        valid: false,
        issues: [
          {
            message: 'complex path error',
            path: [{ key: 'user' }, { key: 'name' }],
          },
        ],
      }))

      const result = validateFieldValue(schema, ['user', 'name'], 'bad', {
        user: { name: 'good' },
      })

      expect((result as NuGridValidationResult).valid).toBe(false)
      expect((result as NuGridValidationResult).message).toBe('complex path error')
    })

    it('returns valid when all issues have paths and none match field', () => {
      const schema = makeSchema((_row) => ({
        valid: false,
        issues: [
          { message: 'error1', path: ['field1'] },
          { message: 'error2', path: ['field2'] },
        ],
      }))

      const result = validateFieldValue(schema, ['field3'], 'value', {
        field1: '',
        field2: '',
        field3: 'value',
      })

      expect((result as NuGridValidationResult).valid).toBe(true)
    })

    it('ignores issues without paths', () => {
      const schema = makeSchema((_row) => ({
        valid: false,
        issues: [
          { message: 'no path error' }, // No path
          { message: 'empty path error', path: [] }, // Empty path
        ],
      }))

      const result = validateFieldValue(schema, ['email'], 'test', {
        email: 'test',
      })

      // Issues without paths don't match field path, so field is valid
      expect((result as NuGridValidationResult).valid).toBe(true)
    })
  })

  describe('formatStandardSchemaIssues', () => {
    it('formats single issue without path', () => {
      const issues: StandardSchemaV1Issue[] = [{ message: 'Value is required' }]
      expect(formatStandardSchemaIssues(issues)).toBe('Value is required')
    })

    it('formats single issue with path', () => {
      const issues: StandardSchemaV1Issue[] = [{ message: 'Must be email', path: ['email'] }]
      expect(formatStandardSchemaIssues(issues)).toBe('email: Must be email')
    })

    it('formats multiple issues', () => {
      const issues: StandardSchemaV1Issue[] = [
        { message: 'Required', path: ['name'] },
        { message: 'Invalid', path: ['email'] },
      ]
      expect(formatStandardSchemaIssues(issues)).toBe('name: Required; email: Invalid')
    })

    it('formats nested path', () => {
      const issues: StandardSchemaV1Issue[] = [
        { message: 'Too short', path: ['user', 'profile', 'name'] },
      ]
      expect(formatStandardSchemaIssues(issues)).toBe('user.profile.name: Too short')
    })

    it('handles path segment objects', () => {
      const issues: StandardSchemaV1Issue[] = [
        { message: 'Error', path: [{ key: 'user' }, { key: 'name' }] },
      ]
      expect(formatStandardSchemaIssues(issues)).toBe('user.name: Error')
    })

    it('handles mixed path types', () => {
      const issues: StandardSchemaV1Issue[] = [
        { message: 'Error', path: ['items', { key: 0 }, 'value'] },
      ]
      expect(formatStandardSchemaIssues(issues)).toBe('items.0.value: Error')
    })

    it('returns default message for empty issues array', () => {
      expect(formatStandardSchemaIssues([])).toBe('Validation failed')
    })

    it('returns default message for undefined issues', () => {
      expect(formatStandardSchemaIssues(undefined as any)).toBe('Validation failed')
    })

    it('handles numeric path segments', () => {
      const issues: StandardSchemaV1Issue[] = [{ message: 'Invalid', path: ['items', 0, 'name'] }]
      expect(formatStandardSchemaIssues(issues)).toBe('items.0.name: Invalid')
    })
  })
})
