import type { ArrayHeaderInfo, Depth, JsonArray, JsonObject, JsonPrimitive, JsonValue, ParsedLine, ResolvedDecodeOptions } from '../types'
import type { ObjectWithQuotedKeys } from './expand'
import type { LineCursor } from './scanner'
import { COLON, DEFAULT_DELIMITER, DOT, LIST_ITEM_PREFIX } from '../constants'
import { findClosingQuote } from '../shared/string-utils'
import { QUOTED_KEY_MARKER } from './expand'
import { isArrayHeaderAfterHyphen, isObjectFirstFieldAfterHyphen, mapRowValuesToPrimitives, parseArrayHeaderLine, parseDelimitedValues, parseKeyToken, parsePrimitiveToken } from './parser'
import { assertExpectedCount, validateNoBlankLinesInRange, validateNoExtraListItems, validateNoExtraTabularRows } from './validation'

// #region Entry decoding

export function decodeValueFromLines(cursor: LineCursor, options: ResolvedDecodeOptions): JsonValue {
  const first = cursor.peek()
  if (!first) {
    throw new ReferenceError('No content to decode')
  }

  // Check for root array
  if (isArrayHeaderAfterHyphen(first.content)) {
    const headerInfo = parseArrayHeaderLine(first.content, DEFAULT_DELIMITER)
    if (headerInfo) {
      cursor.advance() // Move past the header line
      return decodeArrayFromHeader(headerInfo.header, headerInfo.inlineValues, cursor, 0, options)
    }
  }

  // Check for single primitive value
  if (cursor.length === 1 && !isKeyValueLine(first)) {
    return parsePrimitiveToken(first.content.trim())
  }

  // Default to object
  return decodeObject(cursor, 0, options)
}

function isKeyValueLine(line: ParsedLine): boolean {
  const content = line.content
  // Look for unquoted colon or quoted key followed by colon
  if (content.startsWith('"')) {
    // Quoted key - find the closing quote
    const closingQuoteIndex = findClosingQuote(content, 0)
    if (closingQuoteIndex === -1) {
      return false
    }
    // Check if colon exists after quoted key (may have array/brace syntax between)
    return content.slice(closingQuoteIndex + 1).includes(COLON)
  }
  else {
    // Unquoted key - look for first colon not inside quotes
    return content.includes(COLON)
  }
}

// #endregion

// #region Object decoding

function decodeObject(cursor: LineCursor, baseDepth: Depth, options: ResolvedDecodeOptions): JsonObject {
  const obj: JsonObject = {}
  const quotedKeys: Set<string> = new Set()

  // Detect the actual depth of the first field (may differ from baseDepth in nested structures)
  let computedDepth: Depth | undefined

  while (!cursor.atEnd()) {
    const line = cursor.peek()
    if (!line || line.depth < baseDepth) {
      break
    }

    if (computedDepth === undefined && line.depth >= baseDepth) {
      computedDepth = line.depth
    }

    if (line.depth === computedDepth) {
      cursor.advance()
      const { key, value, isQuoted } = decodeKeyValue(line.content, cursor, computedDepth, options)
      obj[key] = value

      // Track quoted dotted keys for expansion phase
      if (isQuoted && key.includes(DOT)) {
        quotedKeys.add(key)
      }
    }
    else {
      // Different depth (shallower or deeper) - stop object parsing
      break
    }
  }

  // Attach quoted key metadata if any were found
  if (quotedKeys.size > 0) {
    (obj as ObjectWithQuotedKeys)[QUOTED_KEY_MARKER] = quotedKeys
  }

  return obj
}

function decodeKeyValue(
  content: string,
  cursor: LineCursor,
  baseDepth: Depth,
  options: ResolvedDecodeOptions,
): { key: string, value: JsonValue, followDepth: Depth, isQuoted: boolean } {
  // Check for array header first (before parsing key)
  const arrayHeader = parseArrayHeaderLine(content, DEFAULT_DELIMITER)
  if (arrayHeader && arrayHeader.header.key) {
    const decodedValue = decodeArrayFromHeader(arrayHeader.header, arrayHeader.inlineValues, cursor, baseDepth, options)
    // After an array, subsequent fields are at baseDepth + 1 (where array content is)
    return {
      key: arrayHeader.header.key,
      value: decodedValue,
      followDepth: baseDepth + 1,
      isQuoted: false, // Array keys parsed separately in `parseArrayHeaderLine`
    }
  }

  // Regular key-value pair
  const { key, end, isQuoted } = parseKeyToken(content, 0)
  const rest = content.slice(end).trim()

  // No value after colon - expect nested object or empty
  if (!rest) {
    const nextLine = cursor.peek()
    if (nextLine && nextLine.depth > baseDepth) {
      const nested = decodeObject(cursor, baseDepth + 1, options)
      return { key, value: nested, followDepth: baseDepth + 1, isQuoted }
    }
    // Empty object
    return { key, value: {}, followDepth: baseDepth + 1, isQuoted }
  }

  // Inline primitive value
  const decodedValue = parsePrimitiveToken(rest)
  return { key, value: decodedValue, followDepth: baseDepth + 1, isQuoted }
}

// #endregion

// #region Array decoding

function decodeArrayFromHeader(
  header: ArrayHeaderInfo,
  inlineValues: string | undefined,
  cursor: LineCursor,
  baseDepth: Depth,
  options: ResolvedDecodeOptions,
): JsonArray {
  // Inline primitive array
  if (inlineValues) {
    // For inline arrays, cursor should already be advanced or will be by caller
    return decodeInlinePrimitiveArray(header, inlineValues, options)
  }

  // For multi-line arrays (tabular or list), the cursor should already be positioned
  // at the array header line, but we haven't advanced past it yet

  // Tabular array
  if (header.fields && header.fields.length > 0) {
    return decodeTabularArray(header, cursor, baseDepth, options)
  }

  // List array
  return decodeListArray(header, cursor, baseDepth, options)
}

function decodeInlinePrimitiveArray(
  header: ArrayHeaderInfo,
  inlineValues: string,
  options: ResolvedDecodeOptions,
): JsonPrimitive[] {
  if (!inlineValues.trim()) {
    assertExpectedCount(0, header.length, 'inline array items', options)
    return []
  }

  const values = parseDelimitedValues(inlineValues, header.delimiter)
  const primitives = mapRowValuesToPrimitives(values)

  assertExpectedCount(primitives.length, header.length, 'inline array items', options)

  return primitives
}

function decodeListArray(
  header: ArrayHeaderInfo,
  cursor: LineCursor,
  baseDepth: Depth,
  options: ResolvedDecodeOptions,
): JsonValue[] {
  const items: JsonValue[] = []
  const itemDepth = baseDepth + 1

  // Track line range for blank line validation
  let startLine: number | undefined
  let endLine: number | undefined

  while (!cursor.atEnd() && items.length < header.length) {
    const line = cursor.peek()
    if (!line || line.depth < itemDepth) {
      break
    }

    // Check for list item (with or without space after hyphen)
    const isListItem = line.content.startsWith(LIST_ITEM_PREFIX) || line.content === '-'

    if (line.depth === itemDepth && isListItem) {
      // Track first and last item line numbers
      if (startLine === undefined) {
        startLine = line.lineNumber
      }
      endLine = line.lineNumber

      const item = decodeListItem(cursor, itemDepth, options)
      items.push(item)

      // Update endLine to the current cursor position (after item was decoded)
      const currentLine = cursor.current()
      if (currentLine) {
        endLine = currentLine.lineNumber
      }
    }
    else {
      break
    }
  }

  assertExpectedCount(items.length, header.length, 'list array items', options)

  // In strict mode, check for blank lines inside the array
  if (options.strict && startLine !== undefined && endLine !== undefined) {
    validateNoBlankLinesInRange(
      startLine, // From first item line
      endLine, // To last item line
      cursor.getBlankLines(),
      options.strict,
      'list array',
    )
  }

  // In strict mode, check for extra items
  if (options.strict) {
    validateNoExtraListItems(cursor, itemDepth, header.length)
  }

  return items
}

function decodeTabularArray(
  header: ArrayHeaderInfo,
  cursor: LineCursor,
  baseDepth: Depth,
  options: ResolvedDecodeOptions,
): JsonObject[] {
  const objects: JsonObject[] = []
  const rowDepth = baseDepth + 1

  // Track line range for blank line validation
  let startLine: number | undefined
  let endLine: number | undefined

  while (!cursor.atEnd() && objects.length < header.length) {
    const line = cursor.peek()
    if (!line || line.depth < rowDepth) {
      break
    }

    if (line.depth === rowDepth) {
      // Track first and last row line numbers
      if (startLine === undefined) {
        startLine = line.lineNumber
      }
      endLine = line.lineNumber

      cursor.advance()
      const values = parseDelimitedValues(line.content, header.delimiter)
      assertExpectedCount(values.length, header.fields!.length, 'tabular row values', options)

      const primitives = mapRowValuesToPrimitives(values)
      const obj: JsonObject = {}

      for (let i = 0; i < header.fields!.length; i++) {
        obj[header.fields![i]!] = primitives[i]!
      }

      objects.push(obj)
    }
    else {
      break
    }
  }

  assertExpectedCount(objects.length, header.length, 'tabular rows', options)

  // In strict mode, check for blank lines inside the array
  if (options.strict && startLine !== undefined && endLine !== undefined) {
    validateNoBlankLinesInRange(
      startLine, // From first row line
      endLine, // To last row line
      cursor.getBlankLines(),
      options.strict,
      'tabular array',
    )
  }

  // In strict mode, check for extra rows
  if (options.strict) {
    validateNoExtraTabularRows(cursor, rowDepth, header)
  }

  return objects
}

// #endregion

// #region List item decoding

function decodeListItem(
  cursor: LineCursor,
  baseDepth: Depth,
  options: ResolvedDecodeOptions,
): JsonValue {
  const line = cursor.next()
  if (!line) {
    throw new ReferenceError('Expected list item')
  }

  // Check for list item (with or without space after hyphen)
  let afterHyphen: string

  // Empty list item should be an empty object
  if (line.content === '-') {
    return {}
  }
  else if (line.content.startsWith(LIST_ITEM_PREFIX)) {
    afterHyphen = line.content.slice(LIST_ITEM_PREFIX.length)
  }
  else {
    throw new SyntaxError(`Expected list item to start with "${LIST_ITEM_PREFIX}"`)
  }

  // Empty content after list item should also be an empty object
  if (!afterHyphen.trim()) {
    return {}
  }

  // Check for array header after hyphen
  if (isArrayHeaderAfterHyphen(afterHyphen)) {
    const arrayHeader = parseArrayHeaderLine(afterHyphen, DEFAULT_DELIMITER)
    if (arrayHeader) {
      return decodeArrayFromHeader(arrayHeader.header, arrayHeader.inlineValues, cursor, baseDepth, options)
    }
  }

  // Check for object first field after hyphen
  if (isObjectFirstFieldAfterHyphen(afterHyphen)) {
    return decodeObjectFromListItem(line, cursor, baseDepth, options)
  }

  // Primitive value
  return parsePrimitiveToken(afterHyphen)
}

function decodeObjectFromListItem(
  firstLine: ParsedLine,
  cursor: LineCursor,
  baseDepth: Depth,
  options: ResolvedDecodeOptions,
): JsonObject {
  const afterHyphen = firstLine.content.slice(LIST_ITEM_PREFIX.length)
  const { key, value, followDepth, isQuoted } = decodeKeyValue(afterHyphen, cursor, baseDepth, options)

  const obj: JsonObject = { [key]: value }
  const quotedKeys: Set<string> = new Set()

  // Track if first key was quoted and dotted
  if (isQuoted && key.includes(DOT)) {
    quotedKeys.add(key)
  }

  // Read subsequent fields
  while (!cursor.atEnd()) {
    const line = cursor.peek()
    if (!line || line.depth < followDepth) {
      break
    }

    if (line.depth === followDepth && !line.content.startsWith(LIST_ITEM_PREFIX)) {
      cursor.advance()
      const { key: k, value: v, isQuoted: kIsQuoted } = decodeKeyValue(line.content, cursor, followDepth, options)
      obj[k] = v

      // Track quoted dotted keys
      if (kIsQuoted && k.includes(DOT)) {
        quotedKeys.add(k)
      }
    }
    else {
      break
    }
  }

  // Attach quoted key metadata if any were found
  if (quotedKeys.size > 0) {
    (obj as ObjectWithQuotedKeys)[QUOTED_KEY_MARKER] = quotedKeys
  }

  return obj
}

// #endregion
