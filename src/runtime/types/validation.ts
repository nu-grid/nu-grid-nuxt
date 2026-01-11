import type { TableData } from '@nuxt/ui'
import type { StandardSchemaV1 } from '../utils/standardSchema'
import type { NuGridRowValidationRule } from './_internal'

/**
 * When validation should run
 * - 'change': Validate on every keystroke/change (real-time)
 * - 'blur': Validate when the editor loses focus
 * - 'submit': Validate only when attempting to save (Enter/Tab/Arrow keys)
 * - 'reward': Show errors only after blur/submission (punish late),
 *   but clear errors immediately when value becomes valid (reward early).
 *   This provides a balanced UX: don't interrupt users while typing valid input,
 *   but give immediate positive feedback when correcting errors.
 */
export type NuGridValidateOn = 'change' | 'blur' | 'submit' | 'reward'

/**
 * When to show validation error messages
 * - 'never': Never show errors
 * - 'hover': Show only while the editor is hovered
 * - 'always': Show whenever invalid (default)
 */
export type NuGridShowErrors = 'never' | 'hover' | 'always'

/**
 * What to do when validation fails and user tries to leave the editor
 * - 'block': Prevent leaving cell until value is valid (default)
 * - 'revert': Revert to original value and allow navigation
 * - 'warn': Allow navigation but show warning
 */
export type NuGridOnInvalid = 'block' | 'revert' | 'warn'

/**
 * Base validation configuration options
 */
interface NuGridValidationOptionsBase {
  /**
   * When to run validation
   * - 'change': Validate on every keystroke (real-time)
   * - 'blur': Validate when the editor loses focus
   * - 'submit': Validate only when attempting to save
   * - 'reward': Punish late (show after blur), reward early (clear when valid)
   * @defaultValue 'reward'
   */
  validateOn?: NuGridValidateOn

  /**
   * When to show error messages
   * - 'always': Show whenever invalid (default)
   * - 'hover': Show only while the editor is hovered
   * - 'never': Never show errors
   * @defaultValue 'always'
   */
  showErrors?: NuGridShowErrors

  /**
   * What to do when validation fails and user tries to leave
   * - 'block': Prevent leaving until valid (default)
   * - 'revert': Revert to original value and allow navigation
   * - 'warn': Allow navigation but show warning
   * @defaultValue 'block'
   */
  onInvalid?: NuGridOnInvalid

  /**
   * Whether to validate when adding a new row
   * @defaultValue true
   */
  validateOnAddRow?: boolean

  /**
   * Icon name to display with error messages
   * @defaultValue 'i-lucide-alert-circle'
   */
  icon?: string
}

/**
 * Validation configuration options for NuGrid props
 */
export interface NuGridValidationOptions<
  T extends TableData = TableData,
> extends NuGridValidationOptionsBase {
  /**
   * The Standard Schema v1 validation schema
   * @see https://standardschema.dev
   */
  schema?: StandardSchemaV1<T>

  /**
   * Row-level validation rules
   * These rules validate relationships between fields in a row
   * They run after cell-level schema validation passes
   *
   * @example
   * rowRules: [
   *   (row) => ({
   *     valid: !(row.department === 'Engineering' && row.salary < 100000),
   *     message: 'Engineering employees must have salary >= $100,000',
   *     failedFields: ['salary']
   *   })
   * ]
   */
  rowRules?: NuGridRowValidationRule<T>[]
}
