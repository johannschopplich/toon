import type { DecodeOptions, EncodeOptions } from '../../toon/src'
import type { InputSource } from './types'
import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import process from 'node:process'
import { createReadStream, createWriteStream } from 'node:fs'
import { Readable, Transform } from 'node:stream'
import { consola } from 'consola'
import { estimateTokenCount } from 'tokenx'
import { decode, decodeStream, encode, encodeStream } from '../../toon/src'
import { formatInputLabel, readInput } from './utils'

export async function encodeToToon(config: {
  input: InputSource
  output?: string
  indent: NonNullable<EncodeOptions['indent']>
  delimiter: NonNullable<EncodeOptions['delimiter']>
  keyFolding?: NonNullable<EncodeOptions['keyFolding']>
  flattenDepth?: number
  printStats: boolean
  stream?: boolean
}): Promise<void> {
  if (config.stream) {
    await encodeToToonStreaming(config)
    return
  }

  const jsonContent = await readInput(config.input)

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
    keyFolding: config.keyFolding,
    flattenDepth: config.flattenDepth,
  }

  const toonOutput = encode(data, encodeOptions)

  if (config.output) {
    await fsp.writeFile(config.output, toonOutput, 'utf-8')
    const relativeInputPath = formatInputLabel(config.input)
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

async function encodeToToonStreaming(config: {
  input: InputSource
  output?: string
  indent: NonNullable<EncodeOptions['indent']>
  delimiter: NonNullable<EncodeOptions['delimiter']>
  keyFolding?: NonNullable<EncodeOptions['keyFolding']>
  flattenDepth?: number
  printStats: boolean
}): Promise<void> {
  // Create input stream
  let inputStream: Readable
  if (config.input.type === 'stdin') {
    inputStream = process.stdin
  } else {
    inputStream = createReadStream(config.input.path, { encoding: 'utf-8' })
  }

  // Create output stream
  let outputStream: NodeJS.WritableStream
  if (config.output) {
    outputStream = createWriteStream(config.output, { encoding: 'utf-8' })
  } else {
    outputStream = process.stdout
  }

  // Create a stream that parses JSON lines
  const jsonLineStream = inputStream.pipe(new JSONLineParser())

  // Create encode stream
  const encodeTransform = encodeStream({
    indent: config.indent,
    delimiter: config.delimiter,
    keyFolding: config.keyFolding,
    flattenDepth: config.flattenDepth,
  })

  // Pipe through encode stream to output
  jsonLineStream.pipe(encodeTransform).pipe(outputStream)

  return new Promise<void>((resolve, reject) => {
    outputStream.on('finish', () => {
      if (config.output) {
        const relativeInputPath = formatInputLabel(config.input)
        const relativeOutputPath = path.relative(process.cwd(), config.output!)
        consola.success(`Encoded \`${relativeInputPath}\` → \`${relativeOutputPath}\` (streaming)`)
      }
      resolve()
    })
    outputStream.on('error', reject)
  })
}

class JSONLineParser extends Transform {
  private buffer = ''

  constructor() {
    super({ objectMode: true })
  }

  _transform(chunk: Buffer | string, encoding: string, callback: () => void) {
    this.buffer += chunk.toString()

    // Split by newlines and parse each line as JSON
    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() || '' // Keep incomplete line

    for (const line of lines) {
      if (line.trim()) {
        try {
          const data = JSON.parse(line.trim())
          this.push(data)
        } catch (error) {
          // Skip invalid JSON lines in streaming mode
          consola.warn(`Skipping invalid JSON line: ${line}`)
        }
      }
    }

    callback()
  }

  _flush(callback: () => void) {
    // Parse remaining buffer
    if (this.buffer.trim()) {
      try {
        const data = JSON.parse(this.buffer.trim())
        this.push(data)
      } catch (error) {
        consola.warn(`Skipping invalid JSON line: ${this.buffer}`)
      }
    }
    callback()
  }
}

export async function decodeToJson(config: {
  input: InputSource
  output?: string
  indent: NonNullable<DecodeOptions['indent']>
  strict: NonNullable<DecodeOptions['strict']>
  expandPaths?: NonNullable<DecodeOptions['expandPaths']>
  stream?: boolean
}): Promise<void> {
  if (config.stream) {
    await decodeToJsonStreaming(config)
    return
  }

  const toonContent = await readInput(config.input)

  let data: unknown
  try {
    const decodeOptions: DecodeOptions = {
      indent: config.indent,
      strict: config.strict,
      expandPaths: config.expandPaths,
    }
    data = decode(toonContent, decodeOptions)
  }
  catch (error) {
    throw new Error(`Failed to decode TOON: ${error instanceof Error ? error.message : String(error)}`)
  }

  const jsonOutput = JSON.stringify(data, undefined, config.indent)

  if (config.output) {
    await fsp.writeFile(config.output, jsonOutput, 'utf-8')
    const relativeInputPath = formatInputLabel(config.input)
    const relativeOutputPath = path.relative(process.cwd(), config.output)
    consola.success(`Decoded \`${relativeInputPath}\` → \`${relativeOutputPath}\``)
  }
  else {
    console.log(jsonOutput)
  }
}

async function decodeToJsonStreaming(config: {
  input: InputSource
  output?: string
  indent: NonNullable<DecodeOptions['indent']>
  strict: NonNullable<DecodeOptions['strict']>
  expandPaths?: NonNullable<DecodeOptions['expandPaths']>
}): Promise<void> {
  // Create input stream
  let inputStream: Readable
  if (config.input.type === 'stdin') {
    inputStream = process.stdin
  } else {
    inputStream = createReadStream(config.input.path, { encoding: 'utf-8' })
  }

  // Create output stream
  let outputStream: NodeJS.WritableStream
  if (config.output) {
    outputStream = createWriteStream(config.output, { encoding: 'utf-8' })
  } else {
    outputStream = process.stdout
  }

  // Create decode stream
  const decodeTransform = decodeStream({
    indent: config.indent,
    strict: config.strict,
    expandPaths: config.expandPaths,
  })

  // Create a stream that formats decoded objects as JSON lines
  const jsonFormatter = new JSONFormatter(config.indent)

  // Pipe: input -> decode -> format -> output
  inputStream.pipe(decodeTransform).pipe(jsonFormatter).pipe(outputStream)

  return new Promise<void>((resolve, reject) => {
    outputStream.on('finish', () => {
      if (config.output) {
        const relativeInputPath = formatInputLabel(config.input)
        const relativeOutputPath = path.relative(process.cwd(), config.output!)
        consola.success(`Decoded \`${relativeInputPath}\` → \`${relativeOutputPath}\` (streaming)`)
      }
      resolve()
    })
    outputStream.on('error', reject)
  })
}

class JSONFormatter extends Transform {
  private indent: number

  constructor(indent: number) {
    super({ writableObjectMode: true })
    this.indent = indent
  }

  _transform(chunk: any, encoding: string, callback: (error?: Error | null) => void) {
    try {
      const jsonString = JSON.stringify(chunk, undefined, this.indent) + '\n'
      this.push(jsonString)
      callback()
    } catch (error) {
      callback(error as Error)
    }
  }
}
