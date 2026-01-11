import type { NuGridCellType } from '../types/cells'
import { actionMenuCellType } from './action-menu'
import { booleanCellType } from './boolean'
import { currencyCellType } from './currency'
import { dateCellType } from './date'
import { lookupCellType } from './lookup'
import { numberCellType } from './number'
import { ratingCellType } from './rating'
import { selectionCellType } from './selection'
import { textareaCellType, textCellType } from './text'

/**
 * All built-in cell types
 * These are automatically registered in the cell type registry
 */
export const builtInCellTypes: NuGridCellType[] = [
  textCellType,
  textareaCellType,
  numberCellType,
  dateCellType,
  booleanCellType,
  selectionCellType,
  actionMenuCellType,
  ratingCellType,
  currencyCellType,
  lookupCellType,
]

// Export individual cell types for convenience
export {
  actionMenuCellType,
  booleanCellType,
  currencyCellType,
  dateCellType,
  lookupCellType,
  numberCellType,
  ratingCellType,
  selectionCellType,
  textareaCellType,
  textCellType,
}

// Export editor components for custom use
export { TextareaEditor } from './text'
