import type { EncodeOptions } from '@byjohann/toon'
import { readFileSync, writeFileSync } from 'node:fs'
import { encode } from '@byjohann/toon'

export interface EncodeConfig {
  input: string
  output?: string
  options?: EncodeOptions
}

/**
 * Encode JSON data to TOON format
 * @param config - Configuration for encoding
 * @returns The encoded TOON string
 */
export function encodeToToon(config: EncodeConfig): string {
  const jsonContent = readFileSync(config.input, 'utf-8')

  let data: unknown
  try {
    data = JSON.parse(jsonContent)
  }
  catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`)
  }

  const toonOutput = encode(data, config.options)

  if (config.output) {
    writeFileSync(config.output, toonOutput, 'utf-8')
  }

  return toonOutput
}
