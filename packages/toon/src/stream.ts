import { Transform, Readable } from 'node:stream'
import type { JsonValue, StreamEncodeOptions, StreamDecodeOptions, ResolvedStreamEncodeOptions, ResolvedStreamDecodeOptions } from './types'
import { encodeValue } from './encode/encoders'
import { normalizeValue } from './encode/normalize'
import { decodeValueFromLines } from './decode/decoders'
import { LineCursor, toParsedLines } from './decode/scanner'
import { expandPathsSafe } from './decode/expand'

function resolveStreamEncodeOptions(options?: StreamEncodeOptions): ResolvedStreamEncodeOptions {
  return {
    indent: options?.indent ?? 2,
    delimiter: options?.delimiter ?? ',',
    keyFolding: options?.keyFolding ?? 'off',
    flattenDepth: options?.flattenDepth ?? Number.POSITIVE_INFINITY,
    highWaterMark: options?.highWaterMark ?? 16384,
  }
}

function resolveStreamDecodeOptions(options?: StreamDecodeOptions): ResolvedStreamDecodeOptions {
  return {
    indent: options?.indent ?? 2,
    strict: options?.strict ?? true,
    expandPaths: options?.expandPaths ?? 'off',
    highWaterMark: options?.highWaterMark ?? 16384,
  }
}

/**
 * Creates a streaming encoder that converts a stream of JSON values to TOON format.
 *
 * @param options - Streaming encoding options
 * @returns Transform stream that converts JsonValue objects to TOON formatted strings
 *
 * @example
 * ```ts
 * import { encodeStream } from 'toon'
 * import { Readable } from 'node:stream'
 *
 * const dataStream = Readable.from([
 *   { name: 'Alice', age: 30 },
 *   { name: 'Bob', age: 25 }
 * ])
 *
 * const toonStream = dataStream.pipe(encodeStream())
 * toonStream.on('data', (chunk) => console.log(chunk.toString()))
 * ```
 */
export function encodeStream(options?: StreamEncodeOptions): Transform {
  const resolvedOptions = resolveStreamEncodeOptions(options)
  return new EncodeTransformStream(resolvedOptions)
}

class EncodeTransformStream extends Transform {
  private options: ResolvedStreamEncodeOptions

  constructor(options: ResolvedStreamEncodeOptions) {
    super({
      highWaterMark: options.highWaterMark,
      objectMode: true, // Input is objects
    })
    this.options = options
  }

  _transform(chunk: JsonValue, encoding: string, callback: (error?: Error | null) => void) {
    try {
      const normalizedValue = normalizeValue(chunk)
      const encoded = encodeValue(normalizedValue, this.options)
      this.push(encoded + '\n')
      callback()
    } catch (error) {
      callback(error as Error)
    }
  }

  _flush(callback: () => void) {
    // No final processing needed
    callback()
  }
}

/**
 * Creates a streaming decoder that converts a stream of TOON strings to JSON values.
 *
 * @param options - Streaming decoding options
 * @returns Transform stream that converts TOON formatted strings to JsonValue objects
 *
 * @example
 * ```ts
 * import { decodeStream } from 'toon'
 * import { Readable } from 'node:stream'
 *
 * const toonData = `name: Alice\nage: 30\n---\nname: Bob\nage: 25\n`
 * const toonStream = Readable.from([toonData])
 *
 * const jsonStream = toonStream.pipe(decodeStream())
 * jsonStream.on('data', (obj) => console.log(obj))
 * ```
 */
export function decodeStream(options?: StreamDecodeOptions): Transform {
  const resolvedOptions = resolveStreamDecodeOptions(options)
  return new DecodeTransformStream(resolvedOptions)
}

class DecodeTransformStream extends Transform {
  private options: ResolvedStreamDecodeOptions
  private buffer = ''

  constructor(options: ResolvedStreamDecodeOptions) {
    super({
      highWaterMark: options.highWaterMark,
      objectMode: true, // Output is objects
    })
    this.options = options
  }

  _transform(chunk: Buffer | string, encoding: string, callback: (error?: Error | null) => void) {
    try {
      this.buffer += chunk.toString()

      // Try to parse complete TOON documents from the buffer
      this.tryParseDocuments()

      callback()
    } catch (error) {
      callback(error as Error)
    }
  }

  _flush(callback: (error?: Error | null) => void) {
    try {
      // Try to parse any remaining content
      if (this.buffer.trim()) {
        const scanResult = toParsedLines(this.buffer, this.options.indent, this.options.strict)
        if (scanResult.lines.length > 0) {
          const cursor = new LineCursor(scanResult.lines, scanResult.blankLines)
          const decodedValue = decodeValueFromLines(cursor, this.options)

          // Apply path expansion if enabled
          const finalValue = this.options.expandPaths === 'safe'
            ? expandPathsSafe(decodedValue, this.options.strict)
            : decodedValue

          this.push(finalValue)
        }
      }
      callback()
    } catch (error) {
      callback(error as Error)
    }
  }

  private tryParseDocuments() {
    // For now, assume each chunk contains complete TOON documents separated by '---'
    // This is a simplified implementation - a full implementation would need to handle
    // partial structures across chunks
    const documents = this.buffer.split('---').map(doc => doc.trim()).filter(doc => doc.length > 0)

    if (documents.length > 1) {
      // Process all complete documents except the last one (which might be incomplete)
      for (let i = 0; i < documents.length - 1; i++) {
        const doc = documents[i]!
        const scanResult = toParsedLines(doc, this.options.indent, this.options.strict)
        if (scanResult.lines.length > 0) {
          const cursor = new LineCursor(scanResult.lines, scanResult.blankLines)
          const decodedValue = decodeValueFromLines(cursor, this.options)

          // Apply path expansion if enabled
          const finalValue = this.options.expandPaths === 'safe'
            ? expandPathsSafe(decodedValue, this.options.strict)
            : decodedValue

          this.push(finalValue)
        }
      }

      // Keep the last (potentially incomplete) document in the buffer
      this.buffer = documents[documents.length - 1]!
    }
  }
}
