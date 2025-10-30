import type { UserConfig, UserConfigFn } from 'tsdown/config'
import { defineConfig } from 'tsdown/config'

const config: UserConfig | UserConfigFn = defineConfig({
  entry: {
    'index': 'src/index.ts',
    'cli/index': 'cli/src/index.ts',
  },
  dts: true,
})

export default config
