import type { CommandDef } from 'citty'
import type { Delimiter } from '../../toon/src'
import type { InputSource } from './types'
import * as path from 'node:path'
import process from 'node:process'
import { defineCommand } from 'citty'
import { consola } from 'consola'
import { name, version } from '../../toon/package.json' with { type: 'json' }
import { DEFAULT_DELIMITER, DELIMITERS } from '../../toon/src'
import { decodeToJson, encodeToToon } from './conversion'
import { detectMode } from './utils'

export const mainCommand: CommandDef<{
  input: {
    type: 'positional'
    description: string
    required: false
  }
  output: {
    type: 'string'
    description: string
    alias: string
  }
  encode: {
    type: 'boolean'
    description: string
    alias: string
  }
  decode: {
    type: 'boolean'
    description: string
    alias: string
  }
  delimiter: {
    type: 'string'
    description: string
    default: string
  }
  indent: {
    type: 'string'
    description: string
    default: string
  }
  lengthMarker: {
    type: 'boolean'
    description: string
    default: false
  }
  strict: {
    type: 'boolean'
    description: string
    default: true
  }
  stats: {
    type: 'boolean'
    description: string
    default: false
  }
}> = defineCommand({
  meta: {
    name,
    description: 'TOON CLI — Convert between JSON and TOON formats',
    version,
  },
  args: {
    input: {
      type: 'positional',
      description: 'Input file path (omit or use "-" to read from stdin)',
      required: false,
    },
    output: {
      type: 'string',
      description: 'Output file path',
      alias: 'o',
    },
    encode: {
      type: 'boolean',
      description: 'Encode JSON to TOON (auto-detected by default)',
      alias: 'e',
    },
    decode: {
      type: 'boolean',
      description: 'Decode TOON to JSON (auto-detected by default)',
      alias: 'd',
    },
    delimiter: {
      type: 'string',
      description: 'Delimiter for arrays: comma (,), tab (\\t), or pipe (|)',
      default: ',',
    },
    indent: {
      type: 'string',
      description: 'Indentation size',
      default: '2',
    },
    lengthMarker: {
      type: 'boolean',
      description: 'Use length marker (#) for arrays',
      default: false,
    },
    strict: {
      type: 'boolean',
      description: 'Enable strict mode for decoding',
      default: true,
    },
    stats: {
      type: 'boolean',
      description: 'Show token statistics',
      default: false,
    },
  },
  async run({ args }) {
    const input = args.input

    const inputSource: InputSource = !input || input === '-'
      ? { type: 'stdin' }
      : { type: 'file', path: path.resolve(input) }
    const outputPath = args.output ? path.resolve(args.output) : undefined

    // Parse and validate indent
    const indent = Number.parseInt(args.indent || '2', 10)
    if (Number.isNaN(indent) || indent < 0) {
      throw new Error(`Invalid indent value: ${args.indent}`)
    }

    // Validate delimiter
    const delimiter = args.delimiter || DEFAULT_DELIMITER
    if (!(Object.values(DELIMITERS)).includes(delimiter as Delimiter)) {
      throw new Error(`Invalid delimiter "${delimiter}". Valid delimiters are: comma (,), tab (\\t), pipe (|)`)
    }

    const mode = detectMode(inputSource, args.encode, args.decode)

    try {
      if (mode === 'encode') {
        await encodeToToon({
          input: inputSource,
          output: outputPath,
          delimiter: delimiter as Delimiter,
          indent,
          lengthMarker: args.lengthMarker === true ? '#' : false,
          printStats: args.stats === true,
        })
      }
      else {
        await decodeToJson({
          input: inputSource,
          output: outputPath,
          indent,
          strict: args.strict !== false,
        })
      }
    }
    catch (error) {
      consola.error(error)
      process.exit(1)
    }
  },
})
