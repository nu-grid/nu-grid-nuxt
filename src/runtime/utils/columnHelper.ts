import type { TableData } from '@nuxt/ui'
import type { ColumnDefTemplate, StringOrTemplateHeader } from '@tanstack/vue-table'
import type { NuGridColumn } from '../types/column'

/**
 * Properties for accessor columns (columns that map to a data field)
 * Omits 'accessorKey' since it's provided separately for type safety
 */
export type AccessorColumnDef<T extends TableData, TValue = unknown> = Omit<
  NuGridColumn<T>,
  'accessorKey' | 'accessorFn'
> & {
  /**
   * Custom accessor function for computed values
   * When provided, this is used instead of direct property access
   */
  accessorFn?: (row: T) => TValue
}

/**
 * Properties for display columns (columns without data accessor)
 * Used for action columns, custom rendered columns, etc.
 */
export type DisplayColumnDef<T extends TableData> = Omit<
  NuGridColumn<T>,
  'accessorKey' | 'accessorFn'
> & {
  /**
   * Unique identifier for the column (required for display columns)
   */
  id: string
}

/**
 * Properties for column groups
 */
export interface GroupColumnDef<T extends TableData> {
  /**
   * Unique identifier for the column group
   */
  id: string
  /**
   * Header for the column group
   */
  header: StringOrTemplateHeader<T, unknown>
  /**
   * Child columns in this group
   */
  columns: NuGridColumn<T>[]
  /**
   * Optional footer for the column group
   */
  footer?: ColumnDefTemplate<{ table: any; column: any }>
  /**
   * Enable resizing for the group
   */
  enableResizing?: boolean
  /**
   * Additional metadata
   */
  meta?: Record<string, unknown>
}

/**
 * Column helper instance with methods for creating typed columns
 */
export interface ColumnHelper<T extends TableData> {
  /**
   * Creates an accessor column that maps to a data field
   *
   * @param accessorKey - The key of the field in the data object
   * @param column - Column configuration options
   * @returns A fully typed NuGridColumn
   *
   * @example
   * const helper = createColumnHelper<User>()
   *
   * helper.accessor('name', {
   *   header: 'Full Name',
   *   size: 200,
   *   enableEditing: true,
   * })
   *
   * @example
   * // With custom accessor function
   * helper.accessor('fullName', {
   *   accessorFn: (row) => `${row.firstName} ${row.lastName}`,
   *   header: 'Full Name',
   * })
   */
  accessor: <TKey extends keyof T & string>(
    accessorKey: TKey,
    column?: AccessorColumnDef<T, T[TKey]>,
  ) => NuGridColumn<T>

  /**
   * Creates a display column without a data accessor
   * Used for action menus, custom buttons, or computed displays
   *
   * @param column - Column configuration with required 'id'
   * @returns A fully typed NuGridColumn
   *
   * @example
   * helper.display({
   *   id: 'actions',
   *   header: '',
   *   size: 50,
   *   cellDataType: 'action-menu',
   *   enableEditing: false,
   *   enableSorting: false,
   * })
   */
  display: (column: DisplayColumnDef<T>) => NuGridColumn<T>

  /**
   * Creates a column group containing multiple columns
   *
   * @param group - Group configuration with child columns
   * @returns A grouped column definition
   *
   * @example
   * helper.group({
   *   id: 'contact',
   *   header: 'Contact Information',
   *   columns: [
   *     helper.accessor('email', { header: 'Email' }),
   *     helper.accessor('phone', { header: 'Phone' }),
   *   ],
   * })
   */
  group: (group: GroupColumnDef<T>) => NuGridColumn<T>
}

/**
 * Creates a column helper for defining NuGrid columns with full type safety
 *
 * Similar to TanStack Table's createColumnHelper, but extended to support
 * NuGrid-specific features like editing, validation, lookups, and more.
 *
 * @returns A column helper instance with accessor, display, and group methods
 *
 * @example
 * interface User {
 *   id: number
 *   name: string
 *   email: string
 *   department: string
 *   salary: number
 *   isActive: boolean
 * }
 *
 * const columnHelper = createColumnHelper<User>()
 *
 * const columns = [
 *   columnHelper.accessor('id', {
 *     header: 'ID',
 *     size: 60,
 *     enableEditing: false,
 *   }),
 *
 *   columnHelper.accessor('name', {
 *     header: 'Name',
 *     size: 200,
 *     requiredNew: true,
 *     validateNew: (value) => ({
 *       valid: value.length >= 2,
 *       message: 'Name must be at least 2 characters',
 *     }),
 *   }),
 *
 *   columnHelper.accessor('email', {
 *     header: 'Email',
 *     cellDataType: 'text',
 *     tooltipValue: (row) => `Contact: ${row.email}`,
 *   }),
 *
 *   columnHelper.accessor('department', {
 *     header: 'Department',
 *     cellDataType: 'lookup',
 *     lookup: {
 *       items: [
 *         { value: 'engineering', label: 'Engineering' },
 *         { value: 'marketing', label: 'Marketing' },
 *         { value: 'sales', label: 'Sales' },
 *       ],
 *     },
 *   }),
 *
 *   columnHelper.accessor('salary', {
 *     header: 'Salary',
 *     cellDataType: 'number',
 *     cell: ({ row }) => `$${row.original.salary.toLocaleString()}`,
 *   }),
 *
 *   columnHelper.accessor('isActive', {
 *     header: 'Active',
 *     cellDataType: 'boolean',
 *     size: 80,
 *   }),
 *
 *   columnHelper.display({
 *     id: 'actions',
 *     header: '',
 *     size: 50,
 *     cellDataType: 'action-menu',
 *     enableEditing: false,
 *     enableColumnMenu: false,
 *   }),
 *
 *   // Column groups
 *   columnHelper.group({
 *     id: 'personalInfo',
 *     header: 'Personal Information',
 *     columns: [
 *       columnHelper.accessor('name', { header: 'Name' }),
 *       columnHelper.accessor('email', { header: 'Email' }),
 *     ],
 *   }),
 * ]
 */
export function createColumnHelper<T extends TableData>(): ColumnHelper<T> {
  return {
    accessor<TKey extends keyof T & string>(
      accessorKey: TKey,
      column: AccessorColumnDef<T, T[TKey]> = {},
    ): NuGridColumn<T> {
      return {
        accessorKey,
        ...column,
      } as NuGridColumn<T>
    },

    display(column: DisplayColumnDef<T>): NuGridColumn<T> {
      return column as NuGridColumn<T>
    },

    group(group: GroupColumnDef<T>): NuGridColumn<T> {
      return {
        id: group.id,
        header: group.header,
        columns: group.columns,
        footer: group.footer,
        enableResizing: group.enableResizing,
        meta: group.meta,
      } as unknown as NuGridColumn<T>
    },
  }
}
