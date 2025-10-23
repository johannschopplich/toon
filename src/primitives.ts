import type { JsonPrimitive } from './types'
import {
  BACKSLASH,
  COMMA,
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

export function isNumericLike(value: string): boolean {
  // Match numbers like: 42, -3.14, 1e-6, 05, etc.
  return /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value) || /^0\d+$/.test(value)
}

export function isPaddedWithWhitespace(value: string): boolean {
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
  },
): string {
  const key = options?.key
  const fields = options?.fields

  let header = ''

  if (key) {
    header += encodeKey(key)
  }

  header += `[${length}]`

  if (fields) {
    const quotedFields = fields.map(f => encodeKey(f))
    header += `{${quotedFields.join(',')}}`
  }

  header += ':'

  return header
}

// #endregion
