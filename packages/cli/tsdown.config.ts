import type { UserConfig, UserConfigFn } from 'tsdown/config'
import { defineConfig } from 'tsdown/config'

const config: UserConfig | UserConfigFn = defineConfig({
  entry: {
    index: 'src/cli-entry.ts',
  },
  dts: true,
})

export default config
