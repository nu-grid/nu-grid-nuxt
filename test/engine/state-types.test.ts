import { describe, expectTypeOf, it } from 'vitest'

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingInfoState,
  ColumnSizingState,
  ExpandedState,
  GroupingState,
  PaginationState,
  RowPinningState,
  RowSelectionState,
  SortingState,
  Updater,
  VisibilityState,
} from '../../src/runtime/types/state-types'

/**
 * Structural tests — verify NuGrid state types have the expected shapes.
 */

describe('state type structure', () => {
  it('SortingState is an array of { id, desc }', () => {
    expectTypeOf<SortingState>().toMatchTypeOf<Array<{ id: string; desc: boolean }>>()
  })

  it('ColumnFiltersState is an array of { id, value }', () => {
    expectTypeOf<ColumnFiltersState>().toMatchTypeOf<Array<{ id: string; value: unknown }>>()
  })

  it('ColumnPinningState has optional left/right arrays', () => {
    expectTypeOf<ColumnPinningState>().toMatchTypeOf<{ left?: string[]; right?: string[] }>()
  })

  it('RowSelectionState is Record<string, boolean>', () => {
    expectTypeOf<RowSelectionState>().toMatchTypeOf<Record<string, boolean>>()
  })

  it('VisibilityState is Record<string, boolean>', () => {
    expectTypeOf<VisibilityState>().toMatchTypeOf<Record<string, boolean>>()
  })

  it('ColumnOrderState is string[]', () => {
    expectTypeOf<ColumnOrderState>().toMatchTypeOf<string[]>()
  })

  it('GroupingState is string[]', () => {
    expectTypeOf<GroupingState>().toMatchTypeOf<string[]>()
  })

  it('ExpandedState is true | Record<string, boolean>', () => {
    expectTypeOf<true>().toMatchTypeOf<ExpandedState>()
    expectTypeOf<Record<string, boolean>>().toMatchTypeOf<ExpandedState>()
  })

  it('PaginationState has pageIndex and pageSize', () => {
    expectTypeOf<PaginationState>().toMatchTypeOf<{ pageIndex: number; pageSize: number }>()
  })

  it('ColumnSizingState is Record<string, number>', () => {
    expectTypeOf<ColumnSizingState>().toMatchTypeOf<Record<string, number>>()
  })

  it('ColumnSizingInfoState has expected shape', () => {
    expectTypeOf<ColumnSizingInfoState>().toMatchTypeOf<{
      isResizingColumn: false | string
      columnSizingStart: [string, number][]
    }>()
  })

  it('RowPinningState has optional top/bottom arrays', () => {
    expectTypeOf<RowPinningState>().toMatchTypeOf<{ top?: string[]; bottom?: string[] }>()
  })

  it('Updater is T | ((old: T) => T)', () => {
    expectTypeOf<number>().toMatchTypeOf<Updater<number>>()
    expectTypeOf<(old: number) => number>().toMatchTypeOf<Updater<number>>()
  })
})
