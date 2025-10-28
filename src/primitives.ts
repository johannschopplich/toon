import type { JsonPrimitive } from './types'
import {
  BACKSLASH,
  COMMA,
  DEFAULT_DELIMITER,
  DOUBLE_QUOTE,
  FALSE_LITERAL,
  LIST_ITEM_MARKER,
  NULL_LITERAL,
  TRUE_LITERAL,
} from './constants'

// #region Primitive encoding

export function encodePrimitive(value: JsonPrimitive, delimiter?: string): string {
  if (value === null) {
    return NULL_LITERAL
  }

  if (typeof value === 'boolean') {
    return String(value)
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return encodeStringLiteral(value, delimiter)
}

export function encodeStringLiteral(value: string, delimiter: string = COMMA): string {
  if (isSafeUnquoted(value, delimiter)) {
    return value
  }

  return `${DOUBLE_QUOTE}${escapeString(value)}${DOUBLE_QUOTE}`
}

export function escapeString(value: string): string {
  return value
    .replace(/\\/g, `${BACKSLASH}${BACKSLASH}`)
    .replace(/"/g, `${BACKSLASH}${DOUBLE_QUOTE}`)
    .replace(/\n/g, `${BACKSLASH}n`)
    .replace(/\r/g, `${BACKSLASH}r`)
    .replace(/\t/g, `${BACKSLASH}t`)
}

export function isSafeUnquoted(value: string, delimiter: string = COMMA): boolean {
  if (!value) {
    return false
  }

  if (isPaddedWithWhitespace(value)) {
    return false
  }

  if (value === TRUE_LITERAL || value === FALSE_LITERAL || value === NULL_LITERAL) {
    return false
  }

  if (isNumericLike(value)) {
    return false
  }

  // Check for colon (always structural)
  if (value.includes(':')) {
    return false
  }

  // Check for quotes and backslash (always need escaping)
  if (value.includes('"') || value.includes('\\')) {
    return false
  }

  // Check for brackets and braces (always structural)
  if (/[[\]{}]/.test(value)) {
    return false
  }

  // Check for control characters (newline, carriage return, tab - always need quoting/escaping)
  if (/[\n\r\t]/.test(value)) {
    return false
  }

  // Check for the active delimiter
  if (value.includes(delimiter)) {
    return false
  }

  // Check for hyphen at start (list marker)
  if (value.startsWith(LIST_ITEM_MARKER)) {
    return false
  }

  return true
}

function isNumericLike(value: string): boolean {
  // Match numbers like: 42, -3.14, 1e-6, 05, etc.
  return /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value) || /^0\d+$/.test(value)
}

function isPaddedWithWhitespace(value: string): boolean {
  return value !== value.trim()
}

// #endregion

// #region Key encoding

export function encodeKey(key: string): string {
  if (isValidUnquotedKey(key)) {
    return key
  }

  return `${DOUBLE_QUOTE}${escapeString(key)}${DOUBLE_QUOTE}`
}

function isValidUnquotedKey(key: string): boolean {
  return /^[A-Z_][\w.]*$/i.test(key)
}

// #endregion

// #region Value joining

export function joinEncodedValues(values: readonly JsonPrimitive[], delimiter: string = COMMA): string {
  return values.map(v => encodePrimitive(v, delimiter)).join(delimiter)
}

// #endregion

// #region Header formatters

/**
 * Header formatter for arrays and tables with optional key prefix and field names
 */
export function formatHeader(
  length: number,
  options?: {
    key?: string
    fields?: readonly string[]
    delimiter?: string
    lengthMarker?: '#' | false
  },
): string {
  const key = options?.key
  const fields = options?.fields
  const delimiter = options?.delimiter ?? COMMA
  const lengthMarker = options?.lengthMarker ?? false

  let header = ''

  if (key) {
    header += encodeKey(key)
  }

  // Only include delimiter if it's not the default (comma)
  header += `[${lengthMarker || ''}${length}${delimiter !== DEFAULT_DELIMITER ? delimiter : ''}]`

  if (fields) {
    const quotedFields = fields.map(f => encodeKey(f))
    header += `{${quotedFields.join(delimiter)}}`
  }

  header += ':'

  return header
}

// #endregion

// #region String unescaping (decode)

export function unescapeString(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, DOUBLE_QUOTE)
    .replace(/\\\\/g, BACKSLASH)
}

// #endregion

// #region Primitive decoding

export function decodePrimitive(value: string): JsonPrimitive {
  const trimmed = value.trim()

  // null
  if (trimmed === NULL_LITERAL) {
    return null
  }

  // boolean
  if (trimmed === TRUE_LITERAL) {
    return true
  }
  if (trimmed === FALSE_LITERAL) {
    return false
  }

  // quoted string - check if it starts and ends with quotes and the ending quote is not escaped
  if (trimmed.startsWith(DOUBLE_QUOTE) && trimmed.length >= 2) {
    // Check if string is a valid quoted string
    if (trimmed.endsWith(DOUBLE_QUOTE) && !trimmed.endsWith(`\\${DOUBLE_QUOTE}`)) {
      const content = trimmed.slice(1, -1)
      return unescapeString(content)
    }
    // Handle case where the ending quote might be escaped (e.g., "say \"hello\"")
    // Count trailing backslashes before the final quote
    let backslashCount = 0
    for (let i = trimmed.length - 2; i >= 1; i--) {
      if (trimmed[i] === '\\') {
        backslashCount++
      }
      else {
        break
      }
    }
    // If even number of backslashes (or zero), the quote is not escaped
    if (trimmed.endsWith(DOUBLE_QUOTE) && backslashCount % 2 === 0) {
      const content = trimmed.slice(1, -1)
      return unescapeString(content)
    }
  }

  // number (try to parse as number)
  const num = Number(trimmed)
  if (!Number.isNaN(num) && /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(trimmed)) {
    return num
  }

  // unquoted string
  return trimmed
}

export function decodeKey(key: string): string {
  const trimmed = key.trim()

  // quoted key
  if (trimmed.startsWith(DOUBLE_QUOTE) && trimmed.endsWith(DOUBLE_QUOTE)) {
    const content = trimmed.slice(1, -1)
    return unescapeString(content)
  }

  // unquoted key
  return trimmed
}

// #endregion
