import theme from '#build/ui/table'

export const nuGridTheme = {
  ...theme,
  slots: {
    ...theme.slots,
    // Root container - extends base with height to fill parent container
    root: 'relative overflow-auto h-full',
    // style the checkboxes to match compact theme
    checkboxBase: '',
    checkboxIndicator: '',
    checkboxContainer: '',
    checkboxIcon: '',
    // Base slots with div mode styles merged in - pb-3 provides space for horizontal scrollbar
    base: 'flex flex-col pb-3 w-max min-w-0 border-separate border-spacing-0',
    // Scrollbar styling - uses tailwind-scrollbar plugin
    scrollbar:
      'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400/50 hover:scrollbar-thumb-gray-500/60 dark:scrollbar-thumb-gray-500/50 dark:hover:scrollbar-thumb-gray-400/60 scrollbar-thumb-rounded',
    th: 'flex shrink-0 items-stretch p-0! group text-left rtl:text-right text-sm font-semibold text-highlighted py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
    td: 'flex shrink-0 items-center overflow-hidden p-4 whitespace-nowrap text-sm text-muted outline-none! focus-visible:outline-none! border-b border-default',
    tr: 'flex outline-none! focus-visible:outline-none!',
    loading: 'flex-1',
    empty: 'flex-1',
    separator: 'flex-1 h-0',
    // Additional NuGrid-specific slots
    rowDragHandle: 'flex shrink-0 items-center justify-center px-2 w-10 min-w-10 max-w-10',
    colResizeHandle:
      'flex items-center justify-center w-4 h-full cursor-col-resize select-none touch-none opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 hover:bg-primary-500/10 [&:hover_.col-resizer]:bg-primary-500/80',
    colResizer: 'w-0.5 h-3/5 rounded-sm transition-colors duration-200 bg-gray-400/60 col-resizer',
    rowDragHeaderHandle: 'shrink-0 w-10 min-w-10 max-w-10',
    thInner: 'flex flex-1 items-center px-3 py-2 truncate',
    sortHandle:
      'flex shrink-0 items-center px-1 cursor-pointer select-none opacity-100 hover:text-primary-500 transition-opacity duration-200',
    sortHandleHover:
      'flex shrink-0 items-center px-1 cursor-pointer select-none text-gray-400/60 opacity-0 group-hover:opacity-100 focus-within:opacity-100 hover:text-primary-500 transition-opacity duration-200',
    rowDragIcon: 'inline-block w-4 h-4',
    headerContainer: 'relative flex items-stretch w-full h-full',
    headerControls: 'absolute right-0 inset-y-0 flex items-center z-10 bg-inherit',
    columnMenu:
      'flex items-center px-1 transition-opacity duration-200',
    footerContent: 'w-full truncate',
    groupHeader:
      'flex items-stretch cursor-pointer bg-primary/10 hover:bg-primary/15 transition-colors',
    groupHeaderLeft:
      'sticky left-0 z-50 flex items-center gap-3 px-4 py-3 border-b-0 border-l-4 border-primary',
    groupIcon: 'shrink-0 w-5 h-5 text-primary transition-transform',
    groupLabel: 'text-sm font-medium text-muted',
    groupHeaderSpacer: 'flex-1',
    collapsedHeaderCell:
      'flex shrink-0 items-center overflow-hidden px-3 py-2 border-r border-default/50',
    collapsedText: 'w-full truncate text-sm italic text-muted',
    expandedText: 'w-full truncate text-sm text-muted',
    stickyGroupHeader: 'sticky top-0 z-30 bg-default',
    stickyColumnHeader: 'sticky top-0 z-20 bg-default',
    // Column group header styling (for multi-level headers)
    thGroup:
      'group flex shrink-0 items-stretch overflow-hidden p-0! bg-elevated border-b-2 border-primary/30',
    thGroupInner:
      'flex flex-1 items-center px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted',
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
    alignedPinnedLeft: 'flex flex-row shrink-0 sticky left-0 z-10 bg-elevated',
    alignedPinnedRight: 'flex flex-row shrink-0 sticky right-0 z-10 bg-elevated',
    alignedContent: 'flex flex-col flex-1 min-w-0',
    alignedFiller: 'bg-transparent',
    // Row animation slot - uses CSS variables --nugrid-animation-duration and --nugrid-animation-easing
    // Override this slot to customize the animation effect (e.g., different keyframes or timing)
    rowAnimation: 'animate-nugrid-refresh',
    // Add row indicator - shown when add row is idle (not focused or editing)
    addRowIndicator:
      'absolute inset-0 flex items-center px-3 pointer-events-none text-sm text-muted z-10',
  },
  variants: {
    ...theme.variants,
    gridFocused: {
      true: {},
      false: {},
    },
    focusCell: {
      true: {
        td: 'z-1 shadow-[inset_2px_0_0_0_theme(colors.primary.500/70%),inset_-2px_0_0_0_theme(colors.primary.500/70%),inset_0_2px_0_0_theme(colors.primary.500/70%),inset_0_-2px_0_0_theme(colors.primary.500/70%)]',
      },
      false: {},
    },
    focusRow: {
      true: {
        tr: 'bg-primary/10 ring-2 ring-inset ring-primary/50',
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
        colResizeHandle: 'opacity-100! bg-primary-500/20',
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
        th: 'bg-primary-500/10 opacity-50 transition-[opacity,background-color] duration-200 ease-linear',
      },
    },
    colDropTarget: {
      true: {
        th: 'bg-primary-500/5! data-[drop-position=left]:shadow-[inset_3px_0_0_0_theme(colors.primary.500/80%)] data-[drop-position=right]:shadow-[inset_-3px_0_0_0_theme(colors.primary.500/80%)] transition-shadow duration-200 ease-linear',
      },
    },
    // Multi-row focused state (row focus mode with multi-row layout)
    focusMultiRow: {
      true: {
        multiRowContainer: 'bg-primary/10 ring-2 ring-inset ring-primary rounded',
      },
      false: {},
    },
  },
  compoundVariants: [
    ...theme.compoundVariants,
    {
      pinned: true,
      class: {
        th: 'sticky z-10',
        td: 'sticky z-10',
        thGroup: 'sticky z-10 bg-elevated',
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
        td: 'shadow-[inset_2px_0_0_0_theme(colors.primary.500/70%),inset_0_2px_0_0_theme(colors.primary.500/70%),inset_0_-2px_0_0_theme(colors.primary.500/70%)]',
      },
    },
    {
      focusRow: true,
      hasRightBorder: true,
      class: {
        td: 'shadow-[inset_-2px_0_0_0_theme(colors.primary.500/70%),inset_0_2px_0_0_theme(colors.primary.500/70%),inset_0_-2px_0_0_theme(colors.primary.500/70%)]',
      },
    },
    {
      focusRow: true,
      hasLeftBorder: false,
      hasRightBorder: false,
      class: {
        td: 'shadow-[inset_0_2px_0_0_theme(colors.primary.500/70%),inset_0_-2px_0_0_theme(colors.primary.500/70%)]',
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
