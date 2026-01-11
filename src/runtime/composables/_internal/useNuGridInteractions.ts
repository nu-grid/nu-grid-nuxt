import type { TableData, TableRow } from '@nuxt/ui'
import type { NuGridProps } from '../../types'

/**
 * Shared row interaction handlers
 */
export function useNuGridRowInteractions<T extends TableData>(props: NuGridProps<T>) {
  function onRowSelect(e: Event, row: TableRow<T>) {
    if (!props.onSelect) {
      return
    }
    const target = e.target as HTMLElement
    const isInteractive = target.closest('button') || target.closest('a')
    if (isInteractive) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    props.onSelect(e, row)
  }

  function onRowHover(e: Event, row: TableRow<T> | null) {
    if (!props.onHover) {
      return
    }

    props.onHover(e, row)
  }

  function onRowContextmenu(e: Event, row: TableRow<T>) {
    if (!props.onContextmenu) {
      return
    }

    if (Array.isArray(props.onContextmenu)) {
      props.onContextmenu.forEach((fn) => fn(e, row))
    } else {
      props.onContextmenu(e, row)
    }
  }

  return {
    onRowSelect,
    onRowHover,
    onRowContextmenu,
  }
}
