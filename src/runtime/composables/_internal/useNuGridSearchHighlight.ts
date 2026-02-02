import type { ComputedRef } from 'vue'
import { computed } from 'vue'

/**
 * A segment of text, either highlighted or plain
 */
export interface TextSegment {
  /** The text content */
  text: string
  /** Whether this segment is a match (should be highlighted) */
  isMatch: boolean
}

/**
 * Options for the highlight composable
 */
export interface UseNuGridSearchHighlightOptions {
  /** The search query to highlight */
  searchQuery: ComputedRef<string>
  /** Whether highlighting is enabled */
  enabled?: ComputedRef<boolean>
  /** Case sensitivity for matching */
  caseSensitive?: boolean
}

/**
 * Result of the highlight composable
 */
export interface NuGridSearchHighlightResult {
  /** Split text into segments for highlighting */
  highlightText: (text: string) => TextSegment[]
  /** Check if text contains the search query */
  hasMatch: (text: string) => boolean
  /** Whether highlighting is currently active */
  isActive: ComputedRef<boolean>
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Composable for search text highlighting
 *
 * Provides utilities to highlight matching text in cell content
 * when a search query is active.
 */
export function useNuGridSearchHighlight(
  options: UseNuGridSearchHighlightOptions,
): NuGridSearchHighlightResult {
  const { searchQuery, enabled, caseSensitive = false } = options

  // Whether highlighting is currently active
  const isActive = computed(() => {
    if (enabled && !enabled.value) return false
    return searchQuery.value.length > 0
  })

  /**
   * Split text into segments for highlighting
   * Returns an array of segments, each marked as match or non-match
   */
  function highlightText(text: string): TextSegment[] {
    // If no search query or not active, return single plain segment
    if (!isActive.value || !text) {
      return [{ text: text ?? '', isMatch: false }]
    }

    const query = searchQuery.value
    if (query.length === 0) {
      return [{ text, isMatch: false }]
    }

    // Create regex for matching
    const flags = caseSensitive ? 'g' : 'gi'
    const regex = new RegExp(`(${escapeRegex(query)})`, flags)

    // Split by matches, keeping the delimiter
    const parts = text.split(regex)

    // Filter out empty strings and map to segments
    const segments: TextSegment[] = []
    const lowerQuery = caseSensitive ? query : query.toLowerCase()

    for (const part of parts) {
      if (part === '') continue

      const isMatch = caseSensitive
        ? part === query
        : part.toLowerCase() === lowerQuery

      segments.push({ text: part, isMatch })
    }

    // Return at least one segment if all parts were empty
    if (segments.length === 0) {
      return [{ text, isMatch: false }]
    }

    return segments
  }

  /**
   * Check if text contains the search query
   */
  function hasMatch(text: string): boolean {
    if (!isActive.value || !text) return false

    const query = searchQuery.value
    if (query.length === 0) return false

    if (caseSensitive) {
      return text.includes(query)
    }
    return text.toLowerCase().includes(query.toLowerCase())
  }

  return {
    highlightText,
    hasMatch,
    isActive,
  }
}
