import antfu from '@antfu/eslint-config'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'

export default antfu(
  {
    // @antfu/eslint-config options
    stylistic: false,
    vue: true,
    typescript: true,
  },
  eslintPluginPrettier,
  {
    rules: {
      'vue/prefer-separate-static-class': 'off',
      'vue/no-multiple-template-root': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  {
    ignores: [
      'pnpm-workspace.yaml',
      'prettier.classnames.cjs',
      '**/*.md',
      'dist/**',
      '**/node_modules/**',
      '**/.nuxt/**',
    ],
  },
)
