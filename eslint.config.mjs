// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    'examples/**/*',
  ],
}).append({
  files: ['README.md', 'SPEC.md'],
  rules: {
    'style/no-tabs': 'off',
  },
}).append({
  files: ['**/*.test.ts'],
  rules: {
    'no-console': 'off',
  },
})
