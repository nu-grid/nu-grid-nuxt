import { describe, expect, it } from 'vitest'

import type {
  NuGridValidationResult,
  StandardSchemaV1,
  StandardSchemaV1Issue,
} from '../src/runtime/utils/standardSchema'

import {
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
})
