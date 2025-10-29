import type { UserConfig, UserConfigFn } from 'tsdown/config'
import { defineConfig } from 'tsdown/config'

const config: UserConfig | UserConfigFn = defineConfig({
  entry: ['src/index.ts'],
  dts: false,
  shims: true,
  format: 'esm',
  clean: true,
})

export default config
