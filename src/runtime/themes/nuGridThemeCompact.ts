import theme from '#build/ui/table'

/**
 * Compact theme for NuGrid
 * Features tighter spacing and blue accent color for data-dense applications
 */
export const nuGridThemeCompact = {
  ...theme,
  slots: {
    ...theme.slots,
    // Root container - extends base with height to fill parent container
    // min-h-0 allows shrinking in flex contexts (overrides default min-height: auto)
    root: 'relative overflow-auto h-full min-h-0',
    checkboxBase: 'ring-blue-800 dark:ring-blue-400',
    checkboxIndicator: 'bg-blue-800! dark:bg-blue-400',
    checkboxContainer: '',
    checkboxIcon: '',
    // style the checkboxes to match compact theme
    // Base slots with div mode styles merged in
    base: 'flex flex-col bg-white dark:bg-gray-900',
    // Tighter spacing: px-2 py-1.5 instead of px-4 py-3.5
    th: 'flex shrink-0 items-stretch p-0! group bg-gray-50 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600 last:border-r-0 text-left rtl:text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide',
    // Tighter cell padding: px-2 py-1 instead of p-4
    td: 'flex shrink-0 items-center overflow-hidden border-r border-gray-300/50 dark:border-gray-600/50 last:border-r-0 px-2 py-1 whitespace-nowrap text-sm text-gray-900 dark:text-white outline-none! focus-visible:outline-none!',
    tr: 'flex border-b border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 outline-none! focus-visible:outline-none!',
    tbody: 'divide-y-0!',
    loading: 'flex-1',
    empty: 'flex-1',
    separator: 'flex-1',
    // Additional NuGrid-specific slots
    rowDragHandle: 'flex shrink-0 items-center justify-center px-1 w-8 min-w-8 max-w-8',
    colResizeHandle:
      'flex items-center justify-center w-3 h-full cursor-col-resize select-none touch-none opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 hover:bg-blue-500/10 [&:hover_.col-resizer]:bg-blue-500/80',
    colResizer: 'w-0.5 h-3/5 rounded-sm transition-colors duration-200 bg-gray-400/60 col-resizer',
    rowDragHeaderHandle: 'shrink-0 w-8 min-w-8 max-w-8',
    // Tighter header inner: px-2 py-1 instead of px-3 py-2
    thInner: 'flex flex-1 items-center px-2 py-1 truncate',
    sortHandle:
      'flex shrink-0 items-center px-1 cursor-pointer select-none opacity-100 hover:text-blue-500 transition-opacity duration-200',
    sortHandleHover:
      'flex shrink-0 items-center px-1 cursor-pointer select-none text-gray-400/60 opacity-0 group-hover:opacity-100 focus-within:opacity-100 hover:text-blue-500 transition-opacity duration-200',
    rowDragIcon: 'inline-block w-3.5 h-3.5',
    headerContainer: 'relative flex items-stretch w-full h-full bg-gray-50 dark:bg-gray-800',
    headerControls: 'absolute right-0 inset-y-0 flex items-center z-10 bg-inherit',
    columnMenu: 'flex items-center px-1 transition-opacity duration-200',
    footerContent: 'w-full truncate',
    // Group header styling
    groupHeader:
      'flex items-stretch cursor-pointer bg-blue-500/6 hover:bg-blue-500/10 dark:bg-blue-500/12 dark:hover:bg-blue-500/18 transition-colors',
    groupHeaderLeft:
      'sticky left-0 z-50 flex items-center gap-2 px-2 py-1.5 border-b-0 border-l-3 border-blue-500',
    groupIcon: 'shrink-0 w-4 h-4 text-blue-500 transition-transform',
    groupLabel: 'text-xs font-medium text-gray-900 dark:text-white',
    groupHeaderSpacer: 'flex-1',
    // Collapsed cells with tighter spacing
    collapsedHeaderCell:
      'flex shrink-0 items-center overflow-hidden px-2 py-1 border-r border-gray-300 dark:border-gray-600',
    collapsedText: 'w-full truncate text-xs italic text-gray-500 dark:text-gray-400',
    expandedText: 'w-full truncate text-xs text-gray-900 dark:text-white',
    stickyGroupHeader: 'sticky top-0 z-30 bg-white dark:bg-gray-900',
    stickyColumnHeader: 'sticky top-0 z-20 bg-gray-50 dark:bg-gray-800',
    // Column group header styling (for multi-level headers)
    thGroup:
      'flex shrink-0 items-stretch overflow-hidden p-0! bg-gray-50 dark:bg-gray-800 border-b-2 border-blue-500/40',
    thGroupInner:
      'flex flex-1 items-center px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300',
    // Editor validation error styling
    editorErrorRing: 'ring-error ring-1',
    validationPopoverContent: 'p-2 text-xs',
    validationPopoverInner: 'flex items-center gap-1.5 text-error',
    // Multi-row layout slots
    multiRowHeaderRow: 'flex flex-row',
    multiRowContainer: 'flex flex-col outline-none',
    multiRowDragHandle: 'flex items-center justify-center self-stretch',
    multiRowContent: 'flex flex-col flex-1 min-w-0',
    visualRow: 'flex flex-row',
    // Aligned mode layout slots
    alignedLayout: 'flex flex-row flex-1 min-w-0',
    alignedPinnedLeft: 'flex flex-row shrink-0 sticky left-0 z-10 bg-white dark:bg-gray-900',
    alignedPinnedRight: 'flex flex-row shrink-0 sticky right-0 z-10 bg-white dark:bg-gray-900',
    alignedContent: 'flex flex-col flex-1 min-w-0',
    alignedFiller: 'bg-transparent',
    // Add row indicator - shown when add row is idle (not focused or editing)
    addRowIndicator:
      'absolute inset-0 flex items-center px-2 pointer-events-none text-xs text-gray-500 dark:text-gray-400 z-10',
    // Search panel styling
    searchPanel: 'flex items-center gap-2 px-2 py-1.5 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800',
    searchInput: 'w-full min-w-[180px] max-w-sm',
    // Search highlight styling for matching text in cells (uses primary color by default)
    searchHighlight: 'bg-primary-200 dark:bg-primary-500/40 rounded-sm px-0.5 -mx-0.5',
  },
  variants: {
    ...theme.variants,
    gridFocused: {
      true: {},
      false: {},
    },
    focusCell: {
      true: {
        td: 'z-1 shadow-[inset_1px_0_0_0_rgb(33_150_243),inset_-1px_0_0_0_rgb(33_150_243),inset_0_1px_0_0_rgb(33_150_243),inset_0_-1px_0_0_rgb(33_150_243)]',
      },
      false: {},
    },
    focusRow: {
      true: {
        tr: 'bg-blue-500/12 dark:bg-blue-500/25 ring-1 ring-inset ring-blue-500/50',
        td: 'bg-blue-500/12 dark:bg-blue-500/25',
      },
      false: {},
    },
    rowInvalid: {
      true: {
        td: 'bg-error/10 text-error-700 dark:bg-error/20 dark:text-error-50',
      },
      false: {},
    },
    hasLeftBorder: {
      true: {},
    },
    hasRightBorder: {
      true: {},
    },
    activeRow: {
      true: {
        td: 'bg-blue-500/8 dark:bg-blue-500/15!',
      },
      false: {},
    },
    colResizing: {
      true: {
        colResizeHandle: 'opacity-100! bg-blue-500/10',
        colResizer: 'bg-blue-500 w-1',
      },
      false: {
        colResizeHandle: '',
        colResizer: '',
      },
    },
    colDraggable: {
      true: {
        thInner: 'cursor-move transition-transform duration-300 ease-in-out',
      },
    },
    colDragging: {
      true: {
        th: 'bg-blue-500/15 opacity-50 transition-[opacity,background-color] duration-200 ease-linear',
      },
    },
    colDropTarget: {
      true: {
        th: 'bg-blue-500/10! data-[drop-position=left]:shadow-[inset_3px_0_0_0_rgb(33_150_243)] data-[drop-position=right]:shadow-[inset_-3px_0_0_0_rgb(33_150_243)] transition-shadow duration-200 ease-linear',
      },
    },
    // Multi-row focused state (row focus mode with multi-row layout)
    focusMultiRow: {
      true: {
        multiRowContainer:
          'bg-blue-500/12 dark:bg-blue-500/25 ring-1 ring-inset ring-blue-500 rounded',
      },
      false: {},
    },
  },
  compoundVariants: [
    ...theme.compoundVariants,
    {
      pinned: true,
      class: {
        th: 'sticky z-10 bg-gray-50 dark:bg-gray-800',
        td: 'sticky z-10 bg-white dark:bg-gray-900',
        thGroup: 'sticky z-10 bg-blue-500/6 dark:bg-blue-500/12',
      },
    },
    // Row invalid styling - apply early to ensure it takes precedence
    {
      rowInvalid: true,
      activeRow: true,
      class: {
        td: '!bg-error/10 !text-error-700 dark:!bg-error/20 dark:!text-error-50',
      },
    },
    {
      rowInvalid: true,
      activeRow: false,
      focusRow: false,
      focusCell: false,
      gridFocused: true,
      class: {
        td: '!bg-error/10 !text-error-700 dark:!bg-error/20 dark:!text-error-50',
      },
    },
    {
      rowInvalid: true,
      activeRow: false,
      focusRow: false,
      focusCell: false,
      gridFocused: false,
      class: {
        td: '!bg-error/10 !text-error-700 dark:!bg-error/20 dark:!text-error-50',
      },
    },
    // Unfocused grid background
    {
      focusCell: true,
      gridFocused: false,
      rowInvalid: false,
      class: { td: 'bg-blue-500/12! dark:bg-blue-500/25!' },
    },
    {
      focusRow: true,
      gridFocused: false,
      pinned: false,
      rowInvalid: false,
      class: { td: 'bg-blue-500/12! dark:bg-blue-500/25!' },
    },
    {
      focusRow: true,
      gridFocused: false,
      pinned: true,
      rowInvalid: false,
      class: { td: 'z-10 bg-blue-500/12! dark:bg-blue-500/25!' },
    },
    // Focus row outline borders
    {
      focusRow: true,
      hasLeftBorder: true,
      class: {
        td: 'shadow-[inset_1px_0_0_0_rgb(33_150_243),inset_0_1px_0_0_rgb(33_150_243),inset_0_-1px_0_0_rgb(33_150_243)]',
      },
    },
    {
      focusRow: true,
      hasRightBorder: true,
      class: {
        td: 'shadow-[inset_-1px_0_0_0_rgb(33_150_243),inset_0_1px_0_0_rgb(33_150_243),inset_0_-1px_0_0_rgb(33_150_243)]',
      },
    },
    {
      focusRow: true,
      hasLeftBorder: false,
      hasRightBorder: false,
      class: {
        td: 'shadow-[inset_0_1px_0_0_rgb(33_150_243),inset_0_-1px_0_0_rgb(33_150_243)]',
      },
    },
    {
      focusRow: true,
      rowInvalid: true,
      class: {
        td: 'bg-error/10 text-error-700 dark:bg-error/20 dark:text-error-50 shadow-none',
      },
    },
    {
      focusCell: true,
      rowInvalid: true,
      class: {
        td: 'bg-error/10 text-error-700 dark:bg-error/20 dark:text-error-50 shadow-none',
      },
    },
  ],
}
