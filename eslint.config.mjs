import oxlint from 'eslint-plugin-oxlint'
import perfectionist from 'eslint-plugin-perfectionist'

import withNuxt from './playgrounds/nuxt/.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-imports': [
        'warn',
        {
          type: 'natural',
          newlinesBetween: 1,
          groups: [
            'type-import',
            ['value-builtin', 'value-external'],
            'type-internal',
            'value-internal',
            ['type-parent', 'type-sibling', 'type-index'],
            ['value-parent', 'value-sibling', 'value-index'],
            'unknown',
          ],
        },
      ],
      'perfectionist/sort-named-imports': ['warn', { type: 'natural' }],
      'perfectionist/sort-named-exports': ['warn', { type: 'natural' }],
      'perfectionist/sort-exports': ['warn', { type: 'natural' }],
      // Vue — disable stylistic/noisy rules, keep correctness rules
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      'vue/html-self-closing': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-v-html': 'off',
      'vue/no-dupe-keys': 'off', // false positives with Composition API prop wrapping
      // TypeScript — oxlint handles these (or we don't want them)
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/unified-signatures': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      // Core rules — oxlint handles these
      'no-console': 'off',
      'no-empty': 'off',
      'no-unused-vars': 'off',
      'no-unexpected-multiline': 'off',
      'prefer-const': 'off',
    },
  },
  {
    ignores: ['**/*.md', 'dist/**', '**/node_modules/**', '**/.nuxt/**', '**/.output/**'],
  },
  // Must be last — disables ESLint rules oxlint already covers
  ...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),
)
