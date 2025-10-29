import type { DecodeOptions, EncodeOptions, JsonValue, ResolvedDecodeOptions, ResolvedEncodeOptions } from './types'
import { DEFAULT_DELIMITER } from './constants'
import { decodeValueFromLines } from './decode/decoders'
import { LineCursor, toParsedLines } from './decode/scanner'
import { encodeValue } from './encode/encoders'
import { normalizeValue } from './encode/normalize'

export { DEFAULT_DELIMITER, DELIMITERS } from './constants'
export type {
  DecodeOptions,
  Delimiter,
  DelimiterKey,
  EncodeOptions,
  JsonArray,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  ResolvedDecodeOptions,
  ResolvedEncodeOptions,
} from './types'

export function encode(input: unknown, options?: EncodeOptions): string {
  const normalizedValue = normalizeValue(input)
  const resolvedOptions = resolveOptions(options)
  return encodeValue(normalizedValue, resolvedOptions)
}

export function decode(input: string, options?: DecodeOptions): JsonValue {
  const resolvedOptions = resolveDecodeOptions(options)
  const scanResult = toParsedLines(input, resolvedOptions.indent, resolvedOptions.strict)

  if (scanResult.lines.length === 0) {
    throw new TypeError('Cannot decode empty input: input must be a non-empty string')
  }

  const cursor = new LineCursor(scanResult.lines, scanResult.blankLines)
  return decodeValueFromLines(cursor, resolvedOptions)
}

function resolveOptions(options?: EncodeOptions): ResolvedEncodeOptions {
  return {
    indent: options?.indent ?? 2,
    delimiter: options?.delimiter ?? DEFAULT_DELIMITER,
    lengthMarker: options?.lengthMarker ?? false,
  }
}

function resolveDecodeOptions(options?: DecodeOptions): ResolvedDecodeOptions {
  return {
    indent: options?.indent ?? 2,
    strict: options?.strict ?? true,
  }
}
