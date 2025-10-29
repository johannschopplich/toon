import type {
  ArrayHeaderInfo,
  Delimiter,
  JsonPrimitive,
} from './types'
import {
  BACKSLASH,
  CARRIAGE_RETURN,
  CLOSE_BRACE,
  CLOSE_BRACKET,
  COLON,
  DELIMITERS,
  DOUBLE_QUOTE,
  FALSE_LITERAL,
  HASH,
  NEWLINE,
  NULL_LITERAL,
  OPEN_BRACE,
  OPEN_BRACKET,
  PIPE,
  TAB,
  TRUE_LITERAL,
} from './constants'

// #region Array header parsing

export function parseArrayHeaderLine(
  content: string,
  defaultDelimiter: Delimiter,
): { header: ArrayHeaderInfo, inlineValues?: string } | undefined {
  // Don't match if the line starts with a quote (it's a quoted key, not an array)
  if (content.trimStart().startsWith(DOUBLE_QUOTE)) {
    return undefined
  }

  // Find the bracket segment first
  const bracketStart = content.indexOf(OPEN_BRACKET)
  if (bracketStart === -1) {
    return undefined
  }

  const bracketEnd = content.indexOf(CLOSE_BRACKET, bracketStart)
  if (bracketEnd === -1) {
    return undefined
  }

  // Find the colon that comes after all brackets and braces
  let colonIndex = bracketEnd + 1
  let braceEnd = colonIndex

  // Check for fields segment (braces come after bracket)
  const braceStart = content.indexOf(OPEN_BRACE, bracketEnd)
  if (braceStart !== -1 && braceStart < content.indexOf(COLON, bracketEnd)) {
    const foundBraceEnd = content.indexOf(CLOSE_BRACE, braceStart)
    if (foundBraceEnd !== -1) {
      braceEnd = foundBraceEnd + 1
    }
  }

  // Now find colon after brackets and braces
  colonIndex = content.indexOf(COLON, Math.max(bracketEnd, braceEnd))
  if (colonIndex === -1) {
    return undefined
  }

  const key = bracketStart > 0 ? content.slice(0, bracketStart) : undefined
  const afterColon = content.slice(colonIndex + 1).trim()

  const bracketContent = content.slice(bracketStart + 1, bracketEnd)

  // Try to parse bracket segment; return undefined if it fails
  let parsedBracket
  try {
    parsedBracket = parseBracketSegment(bracketContent, defaultDelimiter)
  }
  catch {
    return undefined
  }

  const { length, delimiter, hasLengthMarker } = parsedBracket

  // Check for fields segment
  let fields: string[] | undefined
  if (braceStart !== -1 && braceStart < colonIndex) {
    const foundBraceEnd = content.indexOf(CLOSE_BRACE, braceStart)
    if (foundBraceEnd !== -1 && foundBraceEnd < colonIndex) {
      const fieldsContent = content.slice(braceStart + 1, foundBraceEnd)
      fields = parseFieldsSegment(fieldsContent, delimiter)
    }
  }

  return {
    header: {
      key,
      length,
      delimiter,
      fields,
      hasLengthMarker,
    },
    inlineValues: afterColon || undefined,
  }
}

export function parseBracketSegment(
  seg: string,
  defaultDelimiter: Delimiter,
): { length: number, delimiter: Delimiter, hasLengthMarker: boolean } {
  let hasLengthMarker = false
  let content = seg

  // Check for length marker
  if (content.startsWith(HASH)) {
    hasLengthMarker = true
    content = content.slice(1)
  }

  // Check for delimiter suffix
  let delimiter = defaultDelimiter
  if (content.endsWith(TAB)) {
    delimiter = DELIMITERS.tab
    content = content.slice(0, -1)
  }
  else if (content.endsWith(PIPE)) {
    delimiter = DELIMITERS.pipe
    content = content.slice(0, -1)
  }

  const length = Number.parseInt(content, 10)
  if (Number.isNaN(length)) {
    throw new TypeError(`Invalid array length: ${seg}`)
  }

  return { length, delimiter, hasLengthMarker }
}

export function parseFieldsSegment(seg: string, delimiter: Delimiter): string[] {
  return parseDelimitedValues(seg, delimiter).map(field => parseStringLiteral(field.trim()))
}

// #endregion

// #region Delimited value parsing

export function parseDelimitedValues(input: string, delimiter: Delimiter): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < input.length) {
    const char = input[i]

    if (char === BACKSLASH && i + 1 < input.length && inQuotes) {
      // Escape sequence in quoted string
      current += char + input[i + 1]
      i += 2
      continue
    }

    if (char === DOUBLE_QUOTE) {
      inQuotes = !inQuotes
      current += char
      i++
      continue
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim())
      current = ''
      i++
      continue
    }

    current += char
    i++
  }

  // Add last value
  if (current || values.length > 0) {
    values.push(current.trim())
  }

  return values
}

export function mapRowValuesToPrimitives(values: string[]): JsonPrimitive[] {
  return values.map(v => parsePrimitiveToken(v))
}

// #endregion

// #region Primitive and key parsing

export function parsePrimitiveToken(token: string): JsonPrimitive {
  const trimmed = token.trim()

  // Empty token
  if (!trimmed) {
    return ''
  }

  // Quoted string (if starts with quote, it MUST be properly quoted)
  if (trimmed.startsWith(DOUBLE_QUOTE)) {
    return parseStringLiteral(trimmed)
  }

  // Boolean or null literals
  if (isBooleanOrNullLiteral(trimmed)) {
    if (trimmed === TRUE_LITERAL)
      return true
    if (trimmed === FALSE_LITERAL)
      return false
    if (trimmed === NULL_LITERAL)
      return null
  }

  // Numeric literal
  if (isNumericLiteral(trimmed)) {
    return Number.parseFloat(trimmed)
  }

  // Unquoted string
  return trimmed
}

export function isBooleanOrNullLiteral(token: string): boolean {
  return token === TRUE_LITERAL || token === FALSE_LITERAL || token === NULL_LITERAL
}

export function isNumericLiteral(token: string): boolean {
  if (!token)
    return false

  // Must not have leading zeros (except for "0" itself or decimals like "0.5")
  if (token.length > 1 && token[0] === '0' && token[1] !== '.') {
    return false
  }

  // Check if it's a valid number
  const num = Number(token)
  return !Number.isNaN(num) && Number.isFinite(num)
}

export function parseStringLiteral(token: string): string {
  const trimmed = token.trim()

  if (trimmed.startsWith(DOUBLE_QUOTE)) {
    // Find the closing quote, accounting for escaped quotes
    let i = 1
    while (i < trimmed.length) {
      if (trimmed[i] === BACKSLASH && i + 1 < trimmed.length) {
        // Skip escaped character
        i += 2
        continue
      }
      if (trimmed[i] === DOUBLE_QUOTE) {
        // Found closing quote
        if (i !== trimmed.length - 1) {
          throw new SyntaxError('Unexpected characters after closing quote')
        }
        const content = trimmed.slice(1, i)
        return unescapeString(content)
      }
      i++
    }

    // If we get here, no closing quote was found
    throw new SyntaxError('Unterminated string: missing closing quote')
  }

  return trimmed
}

export function unescapeString(value: string): string {
  let result = ''
  let i = 0

  while (i < value.length) {
    if (value[i] === BACKSLASH) {
      if (i + 1 >= value.length) {
        throw new SyntaxError('Invalid escape sequence: backslash at end of string')
      }

      const next = value[i + 1]
      if (next === 'n') {
        result += NEWLINE
        i += 2
        continue
      }
      if (next === 't') {
        result += TAB
        i += 2
        continue
      }
      if (next === 'r') {
        result += CARRIAGE_RETURN
        i += 2
        continue
      }
      if (next === BACKSLASH) {
        result += BACKSLASH
        i += 2
        continue
      }
      if (next === DOUBLE_QUOTE) {
        result += DOUBLE_QUOTE
        i += 2
        continue
      }

      throw new SyntaxError(`Invalid escape sequence: \\${next}`)
    }

    result += value[i]
    i++
  }

  return result
}

export function parseUnquotedKey(content: string, start: number): { key: string, end: number } {
  let end = start
  while (end < content.length && content[end] !== COLON) {
    end++
  }

  // Validate that a colon was found
  if (end >= content.length || content[end] !== COLON) {
    throw new SyntaxError('Missing colon after key')
  }

  const key = content.slice(start, end).trim()

  // Skip the colon
  end++

  return { key, end }
}

export function parseQuotedKey(content: string, start: number): { key: string, end: number } {
  let i = start + 1 // Skip opening quote
  let keyContent = ''

  while (i < content.length) {
    if (content[i] === BACKSLASH && i + 1 < content.length) {
      keyContent += content[i]! + content[i + 1]
      i += 2
      continue
    }

    if (content[i] === DOUBLE_QUOTE) {
      // Found closing quote
      const key = unescapeString(keyContent)
      let end = i + 1

      // Validate and skip colon after quoted key
      if (end >= content.length || content[end] !== COLON) {
        throw new SyntaxError('Missing colon after key')
      }
      end++

      return { key, end }
    }

    keyContent += content[i]
    i++
  }

  throw new SyntaxError('Unterminated quoted key')
}

export function parseKeyToken(content: string, start: number): { key: string, end: number } {
  if (content[start] === DOUBLE_QUOTE) {
    return parseQuotedKey(content, start)
  }
  else {
    return parseUnquotedKey(content, start)
  }
}

// #endregion

// #region Array content detection helpers

export function isArrayHeaderAfterHyphen(content: string): boolean {
  return content.trim().startsWith(OPEN_BRACKET) && content.includes(COLON)
}

export function isObjectFirstFieldAfterHyphen(content: string): boolean {
  return content.includes(COLON)
}

// #endregion
