import type {
  Delimiter,
  JsonArray,
  JsonObject,
  JsonPrimitive,
  JsonValue,
} from './types'
import {
  COLON,
  DEFAULT_DELIMITER,
  DELIMITERS,
  OPEN_BRACE,
  OPEN_BRACKET,
} from './constants'
import { decodeKey, decodePrimitive } from './primitives'

// #region Types

interface Line {
  content: string
  depth: number
}

interface ParseContext {
  lines: Line[]
  index: number
}

interface ArrayHeader {
  key?: string
  length: number
  delimiter: Delimiter
  fields?: string[]
}

// #endregion

// #region Line parsing

export function parseLines(input: string, indent: number): Line[] {
  const rawLines = input.split('\n')
  const lines: Line[] = []

  for (const raw of rawLines) {
    if (!raw.trim())
      continue
    const leadingSpaces = raw.length - raw.trimStart().length
    const depth = Math.floor(leadingSpaces / indent)
    const content = raw.trimStart()
    lines.push({ content, depth })
  }

  return lines
}

export function detectIndentation(input: string): number {
  const lines = input.split('\n')
  for (const line of lines) {
    const trimmed = line.trimStart()
    if (!trimmed)
      continue
    const leadingSpaces = line.length - trimmed.length
    if (leadingSpaces > 0) {
      return leadingSpaces <= 2 ? 2 : 4
    }
  }
  return 2
}

// #endregion

// #region Main value parser

export function parseValue(lines: Line[]): JsonValue {
  if (lines.length === 0) {
    return {}
  }

  const ctx: ParseContext = { lines, index: 0 }
  return parseValueInternal(ctx, 0)
}

function parseValueInternal(ctx: ParseContext, currentDepth: number): JsonValue {
  if (ctx.index >= ctx.lines.length) {
    return null
  }

  const line = ctx.lines[ctx.index]!

  // Check if it's a root-level primitive (not a key-value pair or array)
  // If it starts with a quote but doesn't have a colon (or colon is inside the quotes), it's a primitive
  const trimmed = line.content.trim()
  if (trimmed.startsWith('"')) {
    // Find the closing quote (accounting for escapes)
    let inString = true
    let i = 1
    while (i < trimmed.length && inString) {
      if (trimmed[i] === '\\') {
        i += 2 // Skip escaped character
        continue
      }
      if (trimmed[i] === '"') {
        inString = false
        break
      }
      i++
    }
    // If the string is complete and there's no colon after it, it's a primitive
    if (!inString && i < trimmed.length) {
      const afterQuote = trimmed.slice(i + 1).trimStart()
      if (!afterQuote.startsWith(':')) {
        const primitive = decodePrimitive(line.content)
        ctx.index++
        return primitive
      }
    }
    else if (!inString && i === trimmed.length - 1) {
      // String ends at the end of the line, it's a primitive
      const primitive = decodePrimitive(line.content)
      ctx.index++
      return primitive
    }
  }

  const header = parseArrayHeader(line.content)

  if (header && !header.key) {
    ctx.index++
    return parseArrayContent(ctx, currentDepth, header)
  }

  const obj = parseObject(ctx, currentDepth)
  if (obj !== null) {
    return obj
  }

  const primitive = decodePrimitive(line.content)
  ctx.index++
  return primitive
}

// #endregion

// #region Object parsing

function parseObject(ctx: ParseContext, currentDepth: number): JsonObject | null {
  const obj: JsonObject = {}
  let hasKeys = false

  while (ctx.index < ctx.lines.length) {
    const line = ctx.lines[ctx.index]!

    if (line.depth < currentDepth || line.depth > currentDepth) {
      break
    }

    if (isListItem(line.content)) {
      break
    }

    const header = parseArrayHeader(line.content)
    if (header && header.key) {
      hasKeys = true
      ctx.index++
      obj[header.key] = parseArrayContent(ctx, currentDepth, header)
      continue
    }

    const kvp = parseKeyValuePair(line.content)
    if (kvp) {
      hasKeys = true
      ctx.index++

      if (kvp.value === '') {
        const nextLine = ctx.lines[ctx.index]
        if (nextLine && nextLine.depth > currentDepth) {
          obj[kvp.key] = parseObject(ctx, currentDepth + 1)
        }
        else {
          obj[kvp.key] = {}
        }
      }
      else {
        obj[kvp.key] = decodePrimitive(kvp.value)
      }
      continue
    }

    break
  }

  return hasKeys ? obj : null
}

// #endregion

// #region Array parsing

function parseArrayContent(ctx: ParseContext, currentDepth: number, header: ArrayHeader): JsonArray {
  if (header.length === 0) {
    return []
  }

  if (header.fields) {
    return parseTabularArray(ctx, currentDepth, header.fields, header.delimiter, header.length)
  }

  const nextLine = ctx.lines[ctx.index]
  if (!nextLine || nextLine.depth <= currentDepth) {
    const prevLine = ctx.lines[ctx.index - 1]!
    const colonIndex = prevLine.content.indexOf(':')
    if (colonIndex !== -1) {
      const valuesStr = prevLine.content.slice(colonIndex + 1).trimStart()
      if (valuesStr) {
        return parseInlinePrimitiveArray(valuesStr, header.delimiter)
      }
    }
    return []
  }

  if (isListItem(nextLine.content)) {
    return parseListArray(ctx, currentDepth + 1, header.delimiter, header.length)
  }

  return []
}

function parseInlinePrimitiveArray(valuesStr: string, delimiter: Delimiter): JsonPrimitive[] {
  const values = splitByDelimiter(valuesStr, delimiter)
  return values.map(v => decodePrimitive(v))
}

function parseTabularArray(ctx: ParseContext, currentDepth: number, fields: string[], delimiter: Delimiter, expectedLength: number): JsonObject[] {
  const rows: JsonObject[] = []

  while (ctx.index < ctx.lines.length && rows.length < expectedLength) {
    const line = ctx.lines[ctx.index]!

    if (line.depth <= currentDepth || isListItem(line.content)) {
      break
    }

    const values = splitByDelimiter(line.content, delimiter)
    const obj: JsonObject = {}

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]!
      const value = values[i] ?? null
      obj[field] = typeof value === 'string' ? decodePrimitive(value) : null
    }

    rows.push(obj)
    ctx.index++
  }

  return rows
}

function parseListArray(ctx: ParseContext, currentDepth: number, _delimiter: Delimiter, expectedLength: number): JsonArray {
  const items: JsonValue[] = []

  while (ctx.index < ctx.lines.length && items.length < expectedLength) {
    const line = ctx.lines[ctx.index]!

    if (line.depth < currentDepth || line.depth > currentDepth || !isListItem(line.content)) {
      break
    }

    const itemContent = removeListItemPrefix(line.content)

    if (itemContent.trim() === '') {
      items.push({})
      ctx.index++
      continue
    }

    const header = parseArrayHeader(itemContent)
    if (header && !header.key) {
      ctx.index++
      items.push(parseArrayContent(ctx, currentDepth, header))
      continue
    }

    const kvp = parseKeyValuePair(itemContent)
    if (kvp || (header && header.key)) {
      const obj = parseObjectAsListItem(ctx, currentDepth, kvp || { key: header!.key!, value: '' }, header || undefined)
      items.push(obj)
      continue
    }

    items.push(decodePrimitive(itemContent))
    ctx.index++
  }

  return items
}

function parseObjectAsListItem(ctx: ParseContext, currentDepth: number, firstKvp: { key: string, value: string }, firstHeader?: ArrayHeader): JsonObject {
  const obj: JsonObject = {}

  if (firstHeader) {
    ctx.index++
    obj[firstKvp.key] = parseArrayContent(ctx, currentDepth, firstHeader)
  }
  else if (firstKvp.value === '') {
    ctx.index++
    const nextLine = ctx.lines[ctx.index]
    if (nextLine && nextLine.depth > currentDepth) {
      obj[firstKvp.key] = parseObject(ctx, currentDepth + 2)
    }
    else {
      obj[firstKvp.key] = {}
    }
  }
  else {
    obj[firstKvp.key] = decodePrimitive(firstKvp.value)
    ctx.index++
  }

  while (ctx.index < ctx.lines.length) {
    const line = ctx.lines[ctx.index]!

    if (line.depth <= currentDepth || line.depth !== currentDepth + 1 || isListItem(line.content)) {
      break
    }

    const header = parseArrayHeader(line.content)
    if (header && header.key) {
      ctx.index++
      obj[header.key] = parseArrayContent(ctx, currentDepth + 1, header)
      continue
    }

    const kvp = parseKeyValuePair(line.content)
    if (kvp) {
      ctx.index++

      if (kvp.value === '') {
        const nextLine = ctx.lines[ctx.index]
        if (nextLine && nextLine.depth > currentDepth + 1) {
          obj[kvp.key] = parseObject(ctx, currentDepth + 2)
        }
        else {
          obj[kvp.key] = {}
        }
      }
      else {
        obj[kvp.key] = decodePrimitive(kvp.value)
      }
      continue
    }

    break
  }

  return obj
}

// #endregion

// #region Parsing helpers

function parseArrayHeader(line: string): ArrayHeader | null {
  // Match array header: key[#?N<delim?>]{fields?}:
  // Use indexOf to avoid regex backtracking issues
  const openBracketIndex = line.indexOf('[')
  if (openBracketIndex === -1) {
    return null
  }

  const closeBracketIndex = line.indexOf(']', openBracketIndex)
  if (closeBracketIndex === -1) {
    return null
  }

  const keyPart = line.slice(0, openBracketIndex)
  const bracketContent = line.slice(openBracketIndex + 1, closeBracketIndex)
  const afterBracket = line.slice(closeBracketIndex + 1)

  // Parse bracket content: #?N<delim?>
  let lengthStr = ''
  let delimiterPart = ''
  let startIndex = 0

  // Skip optional # marker
  if (bracketContent[0] === '#') {
    startIndex = 1
  }

  // Extract digits
  let i = startIndex
  while (i < bracketContent.length && /\d/.test(bracketContent[i]!)) {
    lengthStr += bracketContent[i]
    i++
  }

  if (!lengthStr) {
    return null
  }

  // Rest is the delimiter (if any)
  delimiterPart = bracketContent.slice(i)

  // Check for fields and colon
  if (!afterBracket.startsWith(':')) {
    // Check if it has fields
    if (!afterBracket.startsWith('{')) {
      return null
    }

    const closeBraceIndex = afterBracket.indexOf('}')
    if (closeBraceIndex === -1 || !afterBracket[closeBraceIndex + 1] || afterBracket[closeBraceIndex + 1] !== ':') {
      return null
    }
  }

  const colonIndex = afterBracket.indexOf(':')
  const fieldsPart = colonIndex > 0 ? afterBracket.slice(0, colonIndex) : undefined

  const key = keyPart.trim() || undefined
  const length = Number.parseInt(lengthStr, 10)

  let delimiter: Delimiter = DEFAULT_DELIMITER
  if (delimiterPart === '\t' || delimiterPart === DELIMITERS.tab) {
    delimiter = DELIMITERS.tab
  }
  else if (delimiterPart === '|' || delimiterPart === DELIMITERS.pipe) {
    delimiter = DELIMITERS.pipe
  }

  let fields: string[] | undefined
  if (fieldsPart && fieldsPart.startsWith('{') && fieldsPart.endsWith('}')) {
    const fieldsContent = fieldsPart.slice(1, -1)
    fields = splitByDelimiter(fieldsContent, delimiter).map(f => decodeKey(f))
  }

  return {
    key: key ? decodeKey(key) : undefined,
    length,
    delimiter,
    fields,
  }
}

function splitByDelimiter(line: string, delimiter: Delimiter): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  let escapeNext = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (escapeNext) {
      current += char
      escapeNext = false
      continue
    }

    if (char === '\\') {
      current += char
      escapeNext = true
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      current += char
      continue
    }

    if (!inQuotes && char === delimiter) {
      values.push(current)
      current = ''
      continue
    }

    current += char
  }

  if (current || values.length > 0) {
    values.push(current)
  }

  return values
}

function parseKeyValuePair(line: string): { key: string, value: string } | null {
  const colonIndex = line.indexOf(COLON)
  if (colonIndex === -1) {
    return null
  }

  const beforeColon = line.slice(0, colonIndex)
  if (beforeColon.includes(OPEN_BRACKET) || beforeColon.includes(OPEN_BRACE)) {
    return null
  }

  const key = decodeKey(line.slice(0, colonIndex))
  const value = line.slice(colonIndex + 1).trimStart()

  return { key, value }
}

function isListItem(line: string): boolean {
  return line.startsWith('- ')
}

function removeListItemPrefix(line: string): string {
  return line.startsWith('- ') ? line.slice(2) : line
}

// #endregion
