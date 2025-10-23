// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu().append({
  files: ['README.md'],
  rules: {
    'style/no-tabs': 'off',
  },
})
