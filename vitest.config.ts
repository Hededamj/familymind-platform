import { defineConfig, configDefaults } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: [
      ...configDefaults.exclude,
      '.claude/**',
      '.superpowers/**',
      '.worktrees/**',
      '.planning/**',
      'docs/**',
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
