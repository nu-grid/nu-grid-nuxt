export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'zinc',
    },
    dashboardSidebar: {
      slots: {
        header: 'h-14 overflow-visible',
      },
    },
    table: {
      variants: {
        pinned: {
          true: {
            th: 'sticky bg-default/75 data-[pinned=left]:z-10 data-[pinned=right]:z-10 backdrop-blur',
            td: 'sticky bg-default/75 data-[pinned=left]:z-10 data-[pinned=right]:z-10 backdrop-blur',
          },
        },
      },
    },
  },
})
