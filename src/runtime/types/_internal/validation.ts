/**
 * @internal
 */

import type { TableData } from '@nuxt/ui'
import type { Ref } from 'vue'
import type { StandardSchemaV1 } from '../../utils/standardSchema'
import type { NuGridOnInvalid, NuGridShowErrors, NuGridValidateOn } from '../validation'

/**
 * Result of a row validation rule
 * @internal
 */
export interface NuGridRowValidationResult {
  /**
   * Whether the row is valid
   */
  valid: boolean

  /**
   * Error message to display
   */
  message?: string

  /**
   * The field(s) that caused the validation failure
   * These cells will be highlighted with error styling
   * If not specified, all cells in the row will show error styling
   */
  failedFields?: string[]
}

/**
 * A row-level validation rule
 * Returns validation result based on the entire row data
 * @internal
 */
export type NuGridRowValidationRule<T extends TableData = TableData> = (
  row: T,
) => NuGridRowValidationResult

/**
 * Normalized validation options resolved internally
 * @internal
 */
export interface NuGridResolvedValidation<T extends TableData = TableData> {
  schema: StandardSchemaV1<T> | null
  rowRules: NuGridRowValidationRule<T>[]
  validateOn: NuGridValidateOn
  showErrors: NuGridShowErrors
  icon: string
  onInvalid: NuGridOnInvalid
  validateOnAddRow: boolean
}

/**
 * Validation context provided to cell editors
 * @internal
 */
export interface NuGridValidationContext {
  showErrors?: Ref<NuGridShowErrors>
  icon?: Ref<string>
}
