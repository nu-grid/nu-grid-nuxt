import { computed, ref } from 'vue'

export function useFocusModeToggle(defaultMode: 'cell' | 'row' = 'cell') {
  const focusMode = ref<'cell' | 'row'>(defaultMode)

  const focusModeLabel = computed(() => (focusMode.value === 'cell' ? 'Cell' : 'Row'))
  const focusModeIcon = computed(() =>
    focusMode.value === 'cell' ? 'i-lucide-grid-2x2' : 'i-lucide-rows',
  )
  const focusModeStatus = computed(() =>
    focusMode.value === 'cell' ? 'Switch to Row Focus' : 'Switch to Cell Focus',
  )

  function toggleFocusMode() {
    focusMode.value = focusMode.value === 'cell' ? 'row' : 'cell'
  }

  return {
    focusMode,
    toggleFocusMode,
    focusModeLabel,
    focusModeIcon,
    focusModeStatus,
  }
}
