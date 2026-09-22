import type { Row } from '../../engine'
import type { NuGridProps } from '../../types'
import type { TableData } from '../../types/table-data'

/**
 * Shared row interaction handlers
 */
export function useNuGridRowInteractions<T extends TableData>(props: NuGridProps<T>) {
  function onRowSelect(e: Event, row: Row<T>) {
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

  function onRowHover(e: Event, row: Row<T> | null) {
    if (!props.onHover) {
      return
    }

    props.onHover(e, row)
  }

  function onRowContextmenu(e: Event, row: Row<T>) {
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
