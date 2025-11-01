import type { DecodeOptions, Delimiter, EncodeOptions } from '../../toon/src'
import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import process from 'node:process'
import { defineCommand, runMain } from 'citty'
import { consola } from 'consola'
import { estimateTokenCount } from 'tokenx'
import { name, version } from '../../toon/package.json' with { type: 'json' }
import { decode, DEFAULT_DELIMITER, DELIMITERS, encode } from '../../toon/src'

const main = defineCommand({
  meta: {
    name,
    description: 'TOON CLI — Convert between JSON and TOON formats',
    version,
  },
  args: {
    input: {
      type: 'positional',
      description: 'Input file path',
      required: true,
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
    const input = args.input || args._[0]
    if (!input) {
      throw new Error('Input file path is required')
    }

    const inputPath = path.resolve(input)
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

    const mode = detectMode(inputPath, args.encode, args.decode)

    try {
      if (mode === 'encode') {
        await encodeToToon({
          input: inputPath,
          output: outputPath,
          delimiter: delimiter as Delimiter,
          indent,
          lengthMarker: args.lengthMarker === true ? '#' : false,
          printStats: args.stats === true,
        })
      }
      else {
        await decodeToJson({
          input: inputPath,
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

function detectMode(
  inputFile: string,
  encodeFlag?: boolean,
  decodeFlag?: boolean,
): 'encode' | 'decode' {
  // Explicit flags take precedence
  if (encodeFlag)
    return 'encode'
  if (decodeFlag)
    return 'decode'

  // Auto-detect based on file extension
  if (inputFile.endsWith('.json'))
    return 'encode'
  if (inputFile.endsWith('.toon'))
    return 'decode'

  // Default to encode
  return 'encode'
}

async function encodeToToon(config: {
  input: string
  output?: string
  delimiter: Delimiter
  indent: number
  lengthMarker: NonNullable<EncodeOptions['lengthMarker']>
  printStats: boolean
}) {
  const jsonContent = await fsp.readFile(config.input, 'utf-8')

  let data: unknown
  try {
    data = JSON.parse(jsonContent)
  }
  catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`)
  }

  const encodeOptions: EncodeOptions = {
    delimiter: config.delimiter,
    indent: config.indent,
    lengthMarker: config.lengthMarker,
  }

  const toonOutput = encode(data, encodeOptions)

  if (config.output) {
    await fsp.writeFile(config.output, toonOutput, 'utf-8')
    const relativeInputPath = path.relative(process.cwd(), config.input)
    const relativeOutputPath = path.relative(process.cwd(), config.output)
    consola.success(`Encoded \`${relativeInputPath}\` → \`${relativeOutputPath}\``)
  }
  else {
    console.log(toonOutput)
  }

  if (config.printStats) {
    const jsonTokens = estimateTokenCount(jsonContent)
    const toonTokens = estimateTokenCount(toonOutput)
    const diff = jsonTokens - toonTokens
    const percent = ((diff / jsonTokens) * 100).toFixed(1)

    console.log()
    consola.info(`Token estimates: ~${jsonTokens} (JSON) → ~${toonTokens} (TOON)`)
    consola.success(`Saved ~${diff} tokens (-${percent}%)`)
  }
}

async function decodeToJson(config: {
  input: string
  output?: string
  indent: number
  strict: boolean
}) {
  const toonContent = await fsp.readFile(config.input, 'utf-8')

  let data: unknown
  try {
    const decodeOptions: DecodeOptions = {
      indent: config.indent,
      strict: config.strict,
    }
    data = decode(toonContent, decodeOptions)
  }
  catch (error) {
    throw new Error(`Failed to decode TOON: ${error instanceof Error ? error.message : String(error)}`)
  }

  const jsonOutput = JSON.stringify(data, undefined, config.indent)

  if (config.output) {
    await fsp.writeFile(config.output, jsonOutput, 'utf-8')
    const relativeInputPath = path.relative(process.cwd(), config.input)
    const relativeOutputPath = path.relative(process.cwd(), config.output)
    consola.success(`Decoded \`${relativeInputPath}\` → \`${relativeOutputPath}\``)
  }
  else {
    console.log(jsonOutput)
  }
}

runMain(main)
