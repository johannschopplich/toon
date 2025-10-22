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

export function encodePrimitive(value: JsonPrimitive): string {
  if (value === null) {
    return NULL_LITERAL
  }

  if (typeof value === 'boolean') {
    return String(value)
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return encodeStringLiteral(value)
}

export function encodeStringLiteral(value: string): string {
  if (isSafeUnquoted(value)) {
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

export function isSafeUnquoted(value: string): boolean {
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

  // Check for structural characters: comma, colon, brackets, braces, hyphen at start, newline, carriage return, tab, double-quote
  if (/[,:\n\r\t"[\]{}]/.test(value) || value.startsWith(LIST_ITEM_MARKER)) {
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

export function joinEncodedValues(values: readonly JsonPrimitive[]): string {
  return values.map(v => encodePrimitive(v)).join(COMMA)
}

// #endregion

// #region Header formatters

export function formatArrayHeader(length: number): string {
  return `[${length}]:`
}

export function formatTabularHeader(length: number, fields: readonly string[]): string {
  const quotedFields = fields.map(f => encodeKey(f))
  return `[${length}]{${quotedFields.join(',')}}:`
}

export function formatKeyedArrayHeader(key: string, length: number): string {
  const encodedKey = encodeKey(key)
  return `${encodedKey}[${length}]:`
}

export function formatKeyedTableHeader(key: string, length: number, fields: readonly string[]): string {
  const encodedKey = encodeKey(key)
  const quotedFields = fields.map(f => encodeKey(f))
  return `${encodedKey}[${length}]{${quotedFields.join(',')}}:`
}

// #endregion
