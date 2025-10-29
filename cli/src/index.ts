#!/usr/bin/env node

import type { DecodeOptions, EncodeOptions } from '@byjohann/toon'
import process from 'node:process'
import { DELIMITERS } from '@byjohann/toon'
import { Command } from 'commander'
import { z } from 'zod'
import { decodeToJson } from './decode.js'
import { encodeToToon } from './encode.js'

interface CliOptions {
  output?: string
  encode?: boolean
  decode?: boolean
  delimiter?: string
  indent?: number
  lengthMarker?: string
  strict?: boolean
}

const delimiterSchema = z.enum(DELIMITERS)

// TODO: Create schema from EncodeOptions
const lengthMarkerSchema = z.union([z.literal('#'), z.literal(false)])

function detectMode(inputFile: string, options: CliOptions): 'encode' | 'decode' {
  // Explicit flags take precedence
  if (options.encode) {
    return 'encode'
  }
  if (options.decode) {
    return 'decode'
  }

  // Auto-detect based on file extension
  if (inputFile.endsWith('.json')) {
    return 'encode'
  }
  if (inputFile.endsWith('.toon')) {
    return 'decode'
  }

  // Default to encode
  return 'encode'
}

async function processFile(inputFile: string, options: CliOptions) {
  const mode = detectMode(inputFile, options)

  try {
    if (mode === 'encode') {
      const encodeOptions: EncodeOptions = {}

      if (options.delimiter !== undefined) {
        const result = delimiterSchema.safeParse(options.delimiter)
        if (!result.success) {
          throw new Error(`Invalid delimiter "${options.delimiter}". Valid delimiters are: comma (,), tab (\\t), pipe (|)`)
        }
        encodeOptions.delimiter = result.data
      }

      encodeOptions.indent = options.indent

      if (options.lengthMarker !== undefined) {
        const result = lengthMarkerSchema.safeParse(options.lengthMarker)
        if (!result.success) {
          throw new Error(`Invalid length marker "${options.lengthMarker}". Only '#' is supported`)
        }
        encodeOptions.lengthMarker = result.data
      }

      const result = encodeToToon({
        input: inputFile,
        output: options.output,
        options: encodeOptions,
      })

      if (!options.output) {
        console.log(result)
      }
      else {
        console.log(`✓ Encoded ${inputFile} successfully → ${options.output}`)
      }
    }
    else {
      const decodeOptions: DecodeOptions = {}
      decodeOptions.indent = options.indent
      decodeOptions.strict = options.strict

      const result = decodeToJson({
        input: inputFile,
        output: options.output,
        options: decodeOptions,
      })

      if (!options.output) {
        console.log(result)
      }
      else {
        console.log(`✓ Decoded ${inputFile} successfully → ${options.output}`)
      }
    }
  }
  catch (error) {
    console.error('✗ Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

const program = new Command()

program
  .name('toon cli')
  .description('Token-Oriented Object Notation - Convert between JSON and TOON formats')
  .version('0.1.0')
  .argument('<input>', 'Input file path')
  .option('-o, --output <file>', 'Output file path')
  .option('-e, --encode', 'Encode JSON to TOON (auto-detected by default)')
  .option('-d, --decode', 'Decode TOON to JSON (auto-detected by default)')
  .option('--delimiter <char>', 'Delimiter for arrays (default: comma)')
  .option('--indent <number>', 'Indentation size (default: 2)', Number.parseInt)
  .option('--length-marker <char>', 'Length marker character (e.g., \'#\')')
  .option('--no-strict', 'Disable strict mode for decoding')
  .addHelpText('after', `
Examples:
  $ toon input.json -o output.toon
  $ toon data.toon -o output.json
  $ toon input.json --delimiter "|" -o output.toon
  $ toon data.toon --no-strict -o output.json
`)
  .action(processFile)

program.parse()
