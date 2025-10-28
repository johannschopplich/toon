// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu().append({
  files: ['README.md', 'SPEC.md'],
  rules: {
    'style/no-tabs': 'off',
  },
})
