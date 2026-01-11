import type { Row } from '@tanstack/vue-table'
import { describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { ADD_ROW_FLAG, useNuGridAddRow } from '../src/runtime/composables/_internal/useNuGridAddRow'

vi.mock('@tanstack/table-core', () => {
  return {
    createRow: (
      _table: any,
      id: string,
      original: any,
      rowIndex: number,
      depth: number,
      _column: any,
      parentId?: string,
    ) => ({
      id,
      original,
      index: rowIndex,
      depth,
      parentId,
      subRows: [] as any[],
      getIsGrouped: () => !!original.__group,
      getValue: (key: string) => original[key],
      getVisibleCells: () => [],
    }),
  }
})

interface RowLike<T = any> {
  id: string
  original: T
  subRows?: RowLike<T>[]
  parentId?: string
  depth?: number
  getIsGrouped: () => boolean
  getValue: (key: string) => any
  getVisibleCells: () => any[]
}

interface TableLike {
  getRowModel: () => { rowsById: Record<string, RowLike> }
  getSortedRowModel: () => { rows: RowLike[] }
  getState: () => { grouping: string[] }
}

function asRows(refRows: { value: RowLike[] }) {
  return computed(() => refRows.value as unknown as Row<any>[])
}

function makeRowsById(rows: RowLike[]): Record<string, RowLike> {
  const map: Record<string, RowLike> = {}
  const visit = (row: RowLike) => {
    map[row.id] = row
    row.subRows?.forEach(visit)
  }
  rows.forEach(visit)
  return map
}

function makeTable(rows: RowLike[], grouping: string[]): TableLike {
  return {
    getRowModel: () => ({ rowsById: makeRowsById(rows) }),
    getSortedRowModel: () => ({ rows }),
    getState: () => ({ grouping }),
  }
}

function dataRow(id: string, values: Record<string, any> = {}): RowLike {
  return {
    id,
    original: values,
    subRows: [],
    parentId: undefined,
    depth: 0,
    getIsGrouped: () => false,
    getValue: (key: string) => values[key],
    getVisibleCells: () => [],
  }
}

describe('useNuGridAddRow', () => {
  it('disables add row when addNewRow is false', () => {
    const rows = ref<RowLike[]>([dataRow('r1')])
    const groupingState = ref<string[]>([])
    const table = makeTable(rows.value, groupingState.value)
    const columns = computed(() => [])

    const hook = useNuGridAddRow({
      props: { addNewRow: false } as any,
      data: ref([]),
      table: table as any,
      rows: asRows(rows),
      columns,
      groupingState,
    })

    expect(hook.showAddNewRow.value).toBe(false)
    expect(hook.orderedRows.value).toHaveLength(1)
  })

  it('places add row at top or bottom based on position', () => {
    const rows = ref<RowLike[]>([dataRow('r1'), dataRow('r2')])
    const groupingState = ref<string[]>([])
    const table = makeTable(rows.value, groupingState.value)
    const columns = computed(() => [])

    const topHook = useNuGridAddRow({
      props: { addNewRow: { position: 'top' } } as any,
      data: ref([]),
      table: table as any,
      rows: asRows(rows),
      columns,
      groupingState,
    })

    const bottomHook = useNuGridAddRow({
      props: { addNewRow: true } as any,
      data: ref([]),
      table: table as any,
      rows: asRows(rows),
      columns,
      groupingState,
    })

    const topOrdered = topHook.orderedRows.value
    expect(topOrdered).toHaveLength(3)
    expect(topHook.isAddRowRow(topOrdered[0])).toBe(true)

    const bottomOrdered = bottomHook.orderedRows.value
    expect(bottomOrdered).toHaveLength(3)
    expect(bottomHook.isAddRowRow(bottomOrdered[2])).toBe(true)
  })

  it('creates grouped add rows with inherited grouping values', () => {
    const groupingState = ref<string[]>(['region'])
    const groupNorth: RowLike = {
      id: 'group-north',
      original: { region: 'north', __group: true },
      depth: 0,
      parentId: undefined,
      subRows: [dataRow('north-1', { region: 'north' })],
      getIsGrouped: () => true,
      getValue: (key: string) => (key === 'region' ? 'north' : undefined),
      getVisibleCells: () => [],
    }
    const groupSouth: RowLike = {
      id: 'group-south',
      original: { region: 'south', __group: true },
      depth: 0,
      parentId: undefined,
      subRows: [dataRow('south-1', { region: 'south' })],
      getIsGrouped: () => true,
      getValue: (key: string) => (key === 'region' ? 'south' : undefined),
      getVisibleCells: () => [],
    }

    const rows = ref<RowLike[]>([groupNorth, groupSouth])
    const table = makeTable(rows.value, groupingState.value)
    const columns = computed(() => [{ id: 'region', columnDef: { id: 'region' } }] as any)

    const hook = useNuGridAddRow({
      props: { addNewRow: true } as any,
      data: ref([]),
      table: table as any,
      rows: asRows(rows),
      columns,
      groupingState,
    })

    hook.refreshAddRows()

    const northAdd = hook.getGroupAddRow('group-north')
    const southAdd = hook.getGroupAddRow('group-south')

    expect(northAdd?.original?.region).toBe('north')
    expect(southAdd?.original?.region).toBe('south')
    expect(northAdd?.original?.[ADD_ROW_FLAG]).toBe(true)
    expect(southAdd?.original?.[ADD_ROW_FLAG]).toBe(true)
  })

  it('clears finalizing flags when onAddRowRequested returns failure', () => {
    const rows = ref<RowLike[]>([])
    const groupingState = ref<string[]>([])
    const table = makeTable([], groupingState.value)
    const columns = computed(() => [{ id: 'name', columnDef: { id: 'name' } }] as any)

    const hook = useNuGridAddRow({
      props: { addNewRow: true } as any,
      data: ref([]),
      table: table as any,
      rows: asRows(rows),
      columns,
      groupingState,
      onAddRowRequested: () => ({ success: false, messages: ['nope'] }),
    })

    const row: RowLike = {
      id: 'add-row-1',
      original: { [ADD_ROW_FLAG]: true, name: 'test' },
      getIsGrouped: () => false,
      getValue: (key: string) => (key === 'name' ? 'test' : undefined),
      getVisibleCells: () => [],
    }

    const result = hook.finalizeAddRow(row as any)
    expect(result.success).toBe(false)
    expect(hook.isFinalizing.value).toBe(false)
    expect(hook.finalizingRowId.value).toBe(null)
  })

  it('clears finalizing flags when onAddRowRequested throws', () => {
    const rows = ref<RowLike[]>([])
    const groupingState = ref<string[]>([])
    const table = makeTable([], groupingState.value)
    const columns = computed(() => [{ id: 'name', columnDef: { id: 'name' } }] as any)

    const hook = useNuGridAddRow({
      props: { addNewRow: true } as any,
      data: ref([]),
      table: table as any,
      rows: asRows(rows),
      columns,
      groupingState,
      onAddRowRequested: () => {
        throw new Error('boom')
      },
    })

    const row: RowLike = {
      id: 'add-row-2',
      original: { [ADD_ROW_FLAG]: true, name: 'test' },
      getIsGrouped: () => false,
      getValue: (key: string) => (key === 'name' ? 'test' : undefined),
      getVisibleCells: () => [],
    }

    const result = hook.finalizeAddRow(row as any)
    expect(result.success).toBe(false)
    expect(result.messages?.[0]).toBe('boom')
    expect(hook.isFinalizing.value).toBe(false)
    expect(hook.finalizingRowId.value).toBe(null)
  })

  it('validates required and custom validation errors', () => {
    const rows = ref<RowLike[]>([])
    const groupingState = ref<string[]>([])
    const table = makeTable([], groupingState.value)
    const columns = computed(
      () =>
        [
          { id: 'name', columnDef: { id: 'name', requiredNew: true } },
          {
            id: 'age',
            columnDef: {
              id: 'age',
              requiredNew: false,
              validateNew: () => ({ valid: false, message: 'too young' }),
            },
          },
        ] as any,
    )

    const hook = useNuGridAddRow({
      props: { addNewRow: true } as any,
      data: ref([]),
      table: table as any,
      rows: asRows(rows),
      columns,
      groupingState,
    })

    const rowMissingRequired: RowLike = {
      id: 'add-row-missing',
      original: { [ADD_ROW_FLAG]: true, age: 10 },
      getIsGrouped: () => false,
      getValue: (key: string) => (key === 'age' ? 10 : undefined),
      getVisibleCells: () => [],
    }

    const missingResult = hook.finalizeAddRow(rowMissingRequired as any)
    expect(missingResult.success).toBe(false)
    expect(missingResult.messages?.some((m: string) => m.includes('name'))).toBe(true)

    const rowInvalidAge: RowLike = {
      id: 'add-row-age',
      original: { [ADD_ROW_FLAG]: true, name: 'alice', age: 10 },
      getIsGrouped: () => false,
      getValue: (key: string) => {
        if (key === 'name') return 'alice'
        if (key === 'age') return 10
        return undefined
      },
      getVisibleCells: () => [],
    }

    const ageResult = hook.finalizeAddRow(rowInvalidAge as any)
    expect(ageResult.success).toBe(false)
    expect(ageResult.messages).toContain('too young')
  })

  it('strips ADD_ROW_FLAG before calling onAddRowRequested', () => {
    const rows = ref<RowLike[]>([])
    const groupingState = ref<string[]>([])
    const table = makeTable([], groupingState.value)
    const columns = computed(() => [{ id: 'name', columnDef: { id: 'name' } }] as any)

    const spy = vi.fn<(row: Record<string, unknown>) => { success: boolean }>(() => ({
      success: true,
    }))

    const hook = useNuGridAddRow({
      props: { addNewRow: true } as any,
      data: ref([]),
      table: table as any,
      rows: asRows(rows),
      columns,
      groupingState,
      onAddRowRequested: spy,
    })

    const row: RowLike = {
      id: 'add-row-flag',
      original: { [ADD_ROW_FLAG]: true, name: 'bob' },
      getIsGrouped: () => false,
      getValue: (key: string) => (key === 'name' ? 'bob' : undefined),
      getVisibleCells: () => [],
    }

    const result = hook.finalizeAddRow(row as any)
    expect(result.success).toBe(true)
    expect(spy).toHaveBeenCalledTimes(1)

    const firstCall = spy.mock.calls[0]
    expect(firstCall).toBeDefined()

    const [calledWith] = firstCall ?? []
    if (!calledWith) {
      throw new Error('Expected spy to receive payload')
    }

    expect(calledWith[ADD_ROW_FLAG]).toBeUndefined()
    expect(calledWith.name).toBe('bob')
  })

  it('does not create group add rows for nested grouped rows', () => {
    const groupingState = ref<string[]>(['region'])
    const nestedGroup: RowLike = {
      id: 'group-parent',
      original: { __group: true },
      depth: 0,
      parentId: undefined,
      subRows: [
        {
          id: 'child-group',
          original: { __group: true },
          depth: 1,
          parentId: 'group-parent',
          subRows: [dataRow('leaf', { region: 'north' })],
          getIsGrouped: () => true,
          getValue: () => undefined,
          getVisibleCells: () => [],
        },
      ],
      getIsGrouped: () => true,
      getValue: () => undefined,
      getVisibleCells: () => [],
    }

    const rows = ref<RowLike[]>([nestedGroup])
    const table = makeTable(rows.value, groupingState.value)
    const columns = computed(() => [{ id: 'region', columnDef: { id: 'region' } }] as any)

    const hook = useNuGridAddRow({
      props: { addNewRow: true } as any,
      data: ref([]),
      table: table as any,
      rows: asRows(rows),
      columns,
      groupingState,
    })

    hook.refreshAddRows()
    expect(hook.getGroupAddRow('group-parent')).toBeNull()
  })
})
