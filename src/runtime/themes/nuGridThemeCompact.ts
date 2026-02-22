import theme from '#build/ui/table'

/**
 * Compact theme for NuGrid
 * Features tighter spacing for data-dense applications
 * Uses the app's primary color (same as default theme) for seamless integration
 */
export const nuGridThemeCompact = {
  ...theme,
  slots: {
    ...theme.slots,
    // Root container - extends base with height to fill parent container
    // min-h-0 and min-w-0 allow shrinking in flex contexts (overrides default min-height/width: auto)
    // Without min-w-0, the root expands to fit content instead of scrolling horizontally
    // nugrid-compact marker class enables compact editor CSS overrides
    root: 'relative overflow-auto h-full min-h-0 min-w-0 nugrid-compact',
    checkboxBase: '',
    checkboxIndicator: '',
    checkboxContainer: '',
    checkboxIcon: '',
    // Base slots with div mode styles merged in
    // overflow-visible! overrides Nuxt UI table's overflow-clip, w-max allows content to extend for horizontal scrolling
    base: 'flex flex-col bg-default w-max! min-w-0! overflow-visible!',
    // Tighter spacing: px-2 py-1.5 instead of px-4 py-3.5
    th: 'flex shrink-0 items-stretch p-0! group bg-elevated border-r border-default last:border-r-0 text-left rtl:text-right text-xs font-semibold text-highlighted uppercase tracking-wide',
    // Tighter cell padding: px-2 py-1 instead of p-4
    td: 'flex shrink-0 items-center overflow-hidden border-r border-default/50 last:border-r-0 px-2 py-1 whitespace-nowrap text-[0.8125rem] text-highlighted outline-none! focus-visible:outline-none!',
    tr: 'flex border-b border-default hover:bg-elevated/50 outline-none! focus-visible:outline-none!',
    tbody: 'divide-y-0!',
    loading: 'flex-1',
    empty: 'flex-1',
    separator: 'flex-1',
    // Additional NuGrid-specific slots
    rowDragHandle: 'flex shrink-0 items-center justify-center px-1 w-8 min-w-8 max-w-8',
    colResizeHandle:
      'flex items-center justify-center w-3 h-full cursor-col-resize select-none touch-none opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 hover:bg-primary-500/10 [&:hover_.col-resizer]:bg-primary-500/80',
    colResizer: 'w-0.5 h-3/5 rounded-sm transition-colors duration-200 bg-gray-400/60 col-resizer',
    rowDragHeaderHandle: 'shrink-0 w-8 min-w-8 max-w-8',
    // Tighter header inner: px-2 py-1 instead of px-3 py-2
    thInner: 'flex flex-1 items-center px-2 py-1 truncate',
    sortHandle:
      'flex shrink-0 items-center px-1 cursor-pointer select-none opacity-100 hover:text-primary-500 transition-opacity duration-200',
    sortHandleHover:
      'flex shrink-0 items-center px-1 cursor-pointer select-none text-dimmed opacity-0 group-hover:opacity-100 focus-within:opacity-100 hover:text-primary-500 transition-opacity duration-200',
    rowDragIcon: 'inline-block w-3.5 h-3.5',
    headerContainer: 'relative flex items-stretch w-full h-full bg-elevated',
    headerControls: 'absolute right-0 inset-y-0 flex items-center z-10 bg-inherit',
    columnMenu: 'flex items-center px-1 transition-opacity duration-200',
    footerContent: 'w-full truncate',
    // Group header styling
    groupHeader:
      'flex items-stretch cursor-pointer bg-primary/6 hover:bg-primary/10 dark:bg-primary/12 dark:hover:bg-primary/18 transition-colors',
    groupHeaderLeft:
      'sticky left-0 z-50 flex items-center gap-2 px-2 py-1.5 border-b-0 border-l-3 border-primary',
    groupIcon: 'shrink-0 w-4 h-4 text-primary transition-transform',
    groupLabel: 'text-xs font-medium text-highlighted',
    groupHeaderSpacer: 'flex-1',
    // Collapsed cells with tighter spacing
    collapsedHeaderCell:
      'flex shrink-0 items-center overflow-hidden px-2 py-1 border-r border-default',
    collapsedText: 'w-full truncate text-xs italic text-muted',
    expandedText: 'w-full truncate text-xs text-highlighted',
    stickyGroupHeader: 'sticky top-0 z-30 bg-default',
    stickyColumnHeader: 'sticky top-0 z-20 bg-elevated',
    // Column group header styling (for multi-level headers)
    thGroup:
      'flex shrink-0 items-stretch overflow-hidden p-0! bg-elevated border-b-2 border-primary/40',
    thGroupInner:
      'flex flex-1 items-center px-2 py-1 text-xs font-semibold uppercase tracking-wide text-highlighted',
    // Editor container slots - compact offsets for tighter cell padding
    editorContainer: '-ml-[8px] mt-px w-full',
    editorContainerTextarea: 'absolute inset-0 -mx-1 -my-1',
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
    alignedPinnedLeft: 'flex flex-row shrink-0 sticky left-0 z-10 bg-default',
    alignedPinnedRight: 'flex flex-row shrink-0 sticky right-0 z-10 bg-default',
    alignedContent: 'flex flex-col flex-1 min-w-0',
    alignedFiller: 'bg-transparent',
    // Add row indicator - shown when add row is idle (not focused or editing)
    addRowIndicator:
      'absolute inset-0 flex items-center px-2 pointer-events-none text-xs text-muted z-10',
    // Search panel styling
    searchPanel: 'flex items-center gap-2 px-2 py-1.5 border-b border-default bg-elevated',
    searchInput: 'w-full min-w-[180px] max-w-sm',
    // Search highlight styling for matching text in cells (uses primary color by default)
    searchHighlight: 'text-inherit bg-primary-200 dark:bg-primary-500/40 rounded-sm px-0.5 -mx-0.5',
  },
  variants: {
    ...theme.variants,
    // Override Nuxt UI's virtualize variant to prevent overflow-clip on base
    virtualize: {
      false: {
        base: '', // Don't add overflow-clip - we use overflow-visible in base slot
        tbody: 'divide-y divide-default',
      },
      true: {},
    },
    gridFocused: {
      true: {},
      false: {},
    },
    focusCell: {
      true: {
        td: 'z-1 shadow-[inset_1px_0_0_0_theme(colors.primary.500/70%),inset_-1px_0_0_0_theme(colors.primary.500/70%),inset_0_1px_0_0_theme(colors.primary.500/70%),inset_0_-1px_0_0_theme(colors.primary.500/70%)]',
      },
      false: {},
    },
    focusRow: {
      true: {
        tr: 'bg-primary/10 ring-1 ring-inset ring-primary/50',
        td: 'bg-primary/10',
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
        td: 'bg-primary/5!',
      },
      false: {},
    },
    colResizing: {
      true: {
        colResizeHandle: 'opacity-100! bg-primary-500/10',
        colResizer: 'bg-primary-500 w-1',
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
        th: 'bg-primary-500/15 opacity-50 transition-[opacity,background-color] duration-200 ease-linear',
      },
    },
    colDropTarget: {
      true: {
        th: 'bg-primary-500/10! data-[drop-position=left]:shadow-[inset_3px_0_0_0_theme(colors.primary.500/80%)] data-[drop-position=right]:shadow-[inset_-3px_0_0_0_theme(colors.primary.500/80%)] transition-shadow duration-200 ease-linear',
      },
    },
    // Multi-row focused state (row focus mode with multi-row layout)
    focusMultiRow: {
      true: {
        multiRowContainer: 'bg-primary/10 ring-1 ring-inset ring-primary rounded',
      },
      false: {},
    },
  },
  compoundVariants: [
    ...theme.compoundVariants,
    {
      pinned: true,
      class: {
        th: 'sticky z-10 bg-elevated',
        td: 'sticky z-10 bg-default',
        thGroup: 'sticky z-10 bg-primary/6 dark:bg-primary/12',
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
      class: { td: 'bg-primary-500/20! dark:bg-primary-400/30!' },
    },
    {
      focusRow: true,
      gridFocused: false,
      pinned: false,
      rowInvalid: false,
      class: { td: 'bg-primary-500/20! dark:bg-primary-400/30!' },
    },
    {
      focusRow: true,
      gridFocused: false,
      pinned: true,
      rowInvalid: false,
      class: { td: 'z-10 bg-primary-500/20! dark:bg-primary-400/30!' },
    },
    // Focus row outline borders
    {
      focusRow: true,
      hasLeftBorder: true,
      class: {
        td: 'shadow-[inset_1px_0_0_0_theme(colors.primary.500/70%),inset_0_1px_0_0_theme(colors.primary.500/70%),inset_0_-1px_0_0_theme(colors.primary.500/70%)]',
      },
    },
    {
      focusRow: true,
      hasRightBorder: true,
      class: {
        td: 'shadow-[inset_-1px_0_0_0_theme(colors.primary.500/70%),inset_0_1px_0_0_theme(colors.primary.500/70%),inset_0_-1px_0_0_theme(colors.primary.500/70%)]',
      },
    },
    {
      focusRow: true,
      hasLeftBorder: false,
      hasRightBorder: false,
      class: {
        td: 'shadow-[inset_0_1px_0_0_theme(colors.primary.500/70%),inset_0_-1px_0_0_theme(colors.primary.500/70%)]',
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
