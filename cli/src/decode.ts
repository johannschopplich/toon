import type { DecodeOptions } from '@byjohann/toon'
import { readFileSync, writeFileSync } from 'node:fs'
import { decode } from '@byjohann/toon'

export interface DecodeConfig {
  input: string
  output?: string
  options?: DecodeOptions
}

/**
 * Decode TOON data to JSON format
 * @param config - Configuration for decoding
 * @returns The decoded JSON string
 */
export function decodeToJson(config: DecodeConfig): string {
  const toonContent = readFileSync(config.input, 'utf-8')

  let data: unknown
  try {
    data = decode(toonContent, config.options)
  }
  catch (error) {
    throw new Error(`Failed to decode TOON: ${error instanceof Error ? error.message : String(error)}`)
  }

  const jsonOutput = JSON.stringify(data, null, 2)

  if (config.output) {
    writeFileSync(config.output, jsonOutput, 'utf-8')
  }

  return jsonOutput
}
