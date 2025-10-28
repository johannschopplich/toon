import type {
  EncodeOptions,
  JsonValue,
  ResolvedEncodeOptions,
} from './types'
import { DEFAULT_DELIMITER } from './constants'
import { detectIndentation, parseLines, parseValue } from './decoders'
import { encodeValue } from './encoders'
import { normalizeValue } from './normalize'

export { DEFAULT_DELIMITER, DELIMITERS } from './constants'
export type {
  Delimiter,
  DelimiterKey,
  EncodeOptions,
  JsonArray,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  ResolvedEncodeOptions,
} from './types'

// #region Encode

export function encode(input: unknown, options?: EncodeOptions): string {
  const normalizedValue = normalizeValue(input)
  const resolvedOptions = resolveOptions(options)
  return encodeValue(normalizedValue, resolvedOptions)
}

function resolveOptions(options?: EncodeOptions): ResolvedEncodeOptions {
  return {
    indent: options?.indent ?? 2,
    delimiter: options?.delimiter ?? DEFAULT_DELIMITER,
    lengthMarker: options?.lengthMarker ?? false,
  }
}

// #endregion

// #region Decode

export interface DecodeOptions {
  indent?: number
}

export function decode(input: string, options?: DecodeOptions): JsonValue {
  if (!input.trim()) {
    return {}
  }

  const indent = options?.indent ?? detectIndentation(input)
  const lines = parseLines(input, indent)

  if (lines.length === 0) {
    return {}
  }

  return parseValue(lines)
}

// #endregion
