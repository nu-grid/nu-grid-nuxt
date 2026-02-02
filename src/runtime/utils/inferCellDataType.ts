/**
 * Regular expressions for type detection
 */

// Currency patterns: $123.45, €99.99, £50.00, ¥1000
const CURRENCY_STRING_PATTERN = /^[$€£¥]\s?[\d,]+(?:\.\d{2})?$/

// Percentage string pattern: 45%, 45.5%
const PERCENTAGE_STRING_PATTERN = /^\d+(?:\.\d+)?%$/

// Column name patterns for heuristic detection
const CURRENCY_COLUMN_PATTERN =
  /price|cost|amount|total|fee|salary|wage|revenue|income|expense|payment|balance|budget/i
const PERCENTAGE_COLUMN_PATTERN = /percent|rate|ratio|pct/i

/**
 * Maximum number of values to sample for type inference
 * Limiting this improves performance for large datasets
 */
const MAX_SAMPLE_SIZE = 10

/**
 * Check if a number has exactly 2 decimal places
 */
function hasTwoDecimalPlaces(value: number): boolean {
  if (!Number.isFinite(value)) return false
  const str = value.toString()
  const decimalIndex = str.indexOf('.')
  if (decimalIndex === -1) return false
  const decimals = str.slice(decimalIndex + 1)
  return decimals.length === 2
}

/**
 * Check if a number is in the 0-1 range (typical for percentages stored as decimals)
 */
function isPercentageRange(value: number): boolean {
  return value >= 0 && value <= 1
}

/**
 * Infer the cell data type from an array of values and optional column name
 *
 * Detection priority:
 * 1. boolean - typeof value === 'boolean'
 * 2. date - value instanceof Date
 * 3. currency - string pattern OR number with 2 decimals + column name heuristic
 * 4. percentage - string pattern OR number 0-1 + column name heuristic
 * 5. number - typeof value === 'number' && !isNaN(value)
 * 6. text - default for strings
 *
 * @param values - Array of values from the column
 * @param columnName - Optional column name for heuristic detection
 * @returns The inferred cell data type, or undefined if no type could be inferred
 */
export function inferCellDataType(values: unknown[], columnName?: string): string | undefined {
  // Filter out null/undefined values and limit sample size
  const samples = values.filter((v) => v !== null && v !== undefined).slice(0, MAX_SAMPLE_SIZE)

  if (samples.length === 0) {
    return undefined
  }

  // Track detected types
  let booleanCount = 0
  let dateCount = 0
  let currencyStringCount = 0
  let currencyNumberCount = 0
  let percentageStringCount = 0
  let percentageNumberCount = 0
  let numberCount = 0
  let stringCount = 0

  // Column name heuristics
  const isCurrencyColumn = columnName ? CURRENCY_COLUMN_PATTERN.test(columnName) : false
  const isPercentageColumn = columnName ? PERCENTAGE_COLUMN_PATTERN.test(columnName) : false

  for (const value of samples) {
    if (typeof value === 'boolean') {
      booleanCount++
    } else if (value instanceof Date) {
      dateCount++
    } else if (typeof value === 'number' && !Number.isNaN(value)) {
      // Check for currency/percentage number patterns
      if (isCurrencyColumn && hasTwoDecimalPlaces(value)) {
        currencyNumberCount++
      } else if (isPercentageColumn && isPercentageRange(value)) {
        percentageNumberCount++
      } else {
        numberCount++
      }
    } else if (typeof value === 'string') {
      // Check for currency/percentage string patterns
      if (CURRENCY_STRING_PATTERN.test(value)) {
        currencyStringCount++
      } else if (PERCENTAGE_STRING_PATTERN.test(value)) {
        percentageStringCount++
      } else {
        stringCount++
      }
    }
  }

  const total = samples.length
  const threshold = 0.8 // 80% of samples must match for type inference

  // Priority-based type detection
  if (booleanCount / total >= threshold) {
    return 'boolean'
  }

  if (dateCount / total >= threshold) {
    return 'date'
  }

  // Currency: either string pattern or number pattern (with column heuristic)
  const totalCurrency = currencyStringCount + currencyNumberCount
  if (totalCurrency / total >= threshold) {
    return 'currency'
  }

  // Percentage: either string pattern or number pattern (with column heuristic)
  const totalPercentage = percentageStringCount + percentageNumberCount
  if (totalPercentage / total >= threshold) {
    return 'percentage'
  }

  // Number (includes currency/percentage numbers that didn't meet heuristic)
  const totalNumbers = numberCount + currencyNumberCount + percentageNumberCount
  if (totalNumbers / total >= threshold) {
    return 'number'
  }

  // Text (includes currency/percentage strings that didn't meet threshold)
  const totalStrings = stringCount + currencyStringCount + percentageStringCount
  if (totalStrings / total >= threshold) {
    return 'text'
  }

  // Mixed types - no inference
  return undefined
}

/**
 * Extract values from data array for a given accessor key
 *
 * @param data - The data array
 * @param accessorKey - The key to extract values from
 * @returns Array of values for the specified key
 */
export function extractColumnValues<T>(data: T[], accessorKey: string): unknown[] {
  return data.slice(0, MAX_SAMPLE_SIZE).map((row) => {
    // Handle nested keys like 'user.name'
    const keys = accessorKey.split('.')
    let value: unknown = row
    for (const key of keys) {
      if (value === null || value === undefined) break
      value = (value as Record<string, unknown>)[key]
    }
    return value
  })
}
