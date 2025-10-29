import type { LineCursor } from './scanner'
import type {
  ArrayHeaderInfo,
  Depth,
  JsonArray,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  ParsedLine,
  ResolvedDecodeOptions,
} from './types'
import {
  COLON,
  DEFAULT_DELIMITER,
  LIST_ITEM_PREFIX,
} from './constants'
import {
  isArrayHeaderAfterHyphen,
  isObjectFirstFieldAfterHyphen,
  mapRowValuesToPrimitives,
  parseArrayHeaderLine,
  parseDelimitedValues,
  parseKeyToken,
  parsePrimitiveToken,
} from './parser'

// #region Entry decoding

export function decodeValueFromLines(cursor: LineCursor, options: ResolvedDecodeOptions): JsonValue {
  const first = cursor.peek()
  if (!first) {
    throw new ReferenceError('No content to decode')
  }

  // Check for root array
  if (isRootArrayHeaderLine(first)) {
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

function isRootArrayHeaderLine(line: ParsedLine): boolean {
  return isArrayHeaderAfterHyphen(line.content)
}

function isKeyValueLine(line: ParsedLine): boolean {
  const content = line.content
  // Look for unquoted colon or quoted key followed by colon
  if (content.startsWith('"')) {
    // Quoted key
    let i = 1
    while (i < content.length) {
      if (content[i] === '\\' && i + 1 < content.length) {
        i += 2
        continue
      }
      if (content[i] === '"') {
        // Found end of quoted key, check for colon
        return content[i + 1] === COLON
      }
      i++
    }
    return false
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

  while (!cursor.atEnd()) {
    const line = cursor.peek()
    if (!line || line.depth < baseDepth) {
      break
    }

    if (line.depth === baseDepth) {
      const [key, value] = decodeKeyValuePair(line, cursor, baseDepth, options)
      obj[key] = value
    }
    else {
      break
    }
  }

  return obj
}

function decodeKeyValue(
  content: string,
  cursor: LineCursor,
  baseDepth: Depth,
  options: ResolvedDecodeOptions,
): { key: string, value: JsonValue, followDepth: Depth } {
  // Check for array header first (before parsing key)
  const arrayHeader = parseArrayHeaderLine(content, DEFAULT_DELIMITER)
  if (arrayHeader && arrayHeader.header.key) {
    const value = decodeArrayFromHeader(arrayHeader.header, arrayHeader.inlineValues, cursor, baseDepth, options)
    // After an array, subsequent fields are at baseDepth + 1 (where array content is)
    return {
      key: arrayHeader.header.key,
      value,
      followDepth: baseDepth + 1,
    }
  }

  // Regular key-value pair
  const { key, end } = parseKeyToken(content, 0)
  const rest = content.slice(end).trim()

  // No value after colon - expect nested object or empty
  if (!rest) {
    const nextLine = cursor.peek()
    if (nextLine && nextLine.depth > baseDepth) {
      const nested = decodeObject(cursor, baseDepth + 1, options)
      return { key, value: nested, followDepth: baseDepth + 1 }
    }
    // Empty object
    return { key, value: {}, followDepth: baseDepth + 1 }
  }

  // Inline primitive value
  const value = parsePrimitiveToken(rest)
  return { key, value, followDepth: baseDepth + 1 }
}

function decodeKeyValuePair(
  line: ParsedLine,
  cursor: LineCursor,
  baseDepth: Depth,
  options: ResolvedDecodeOptions,
): [key: string, value: JsonValue] {
  cursor.advance()
  const { key, value } = decodeKeyValue(line.content, cursor, baseDepth, options)
  return [key, value]
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

  while (!cursor.atEnd() && items.length < header.length) {
    const line = cursor.peek()
    if (!line || line.depth < itemDepth) {
      break
    }

    if (line.depth === itemDepth && line.content.startsWith(LIST_ITEM_PREFIX)) {
      const item = decodeListItem(cursor, itemDepth, header.delimiter, options)
      items.push(item)
    }
    else {
      break
    }
  }

  assertExpectedCount(items.length, header.length, 'list array items', options)

  // In strict mode, check for extra items
  if (options.strict && !cursor.atEnd()) {
    const nextLine = cursor.peek()
    if (nextLine && nextLine.depth === itemDepth && nextLine.content.startsWith(LIST_ITEM_PREFIX)) {
      throw new RangeError(`Expected ${header.length} list array items, but found more`)
    }
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

  while (!cursor.atEnd() && objects.length < header.length) {
    const line = cursor.peek()
    if (!line || line.depth < rowDepth) {
      break
    }

    if (line.depth === rowDepth) {
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

  // In strict mode, check for extra rows
  if (options.strict && !cursor.atEnd()) {
    const nextLine = cursor.peek()
    if (nextLine && nextLine.depth === rowDepth && !nextLine.content.startsWith(LIST_ITEM_PREFIX)) {
      // A key-value pair has a colon (and if it has delimiter, colon comes first)
      // A data row either has no colon, or has delimiter before colon
      const hasColon = nextLine.content.includes(COLON)
      const hasDelimiter = nextLine.content.includes(header.delimiter)

      if (!hasColon) {
        // No colon = data row (for single-field tables)
        throw new RangeError(`Expected ${header.length} tabular rows, but found more`)
      }
      else if (hasDelimiter) {
        // Has both colon and delimiter - check which comes first
        const colonPos = nextLine.content.indexOf(COLON)
        const delimiterPos = nextLine.content.indexOf(header.delimiter)
        if (delimiterPos < colonPos) {
          // Delimiter before colon = data row
          throw new RangeError(`Expected ${header.length} tabular rows, but found more`)
        }
        // Colon before delimiter = key-value pair, OK
      }
      // Has colon but no delimiter = key-value pair, OK
    }
  }

  return objects
}

// #endregion

// #region List item decoding

function decodeListItem(
  cursor: LineCursor,
  baseDepth: Depth,
  activeDelimiter: string,
  options: ResolvedDecodeOptions,
): JsonValue {
  const line = cursor.next()
  if (!line) {
    throw new ReferenceError('Expected list item')
  }

  const afterHyphen = line.content.slice(LIST_ITEM_PREFIX.length)

  // Check for array header after hyphen
  if (isArrayHeaderAfterHyphen(afterHyphen)) {
    const arrayHeader = parseArrayHeaderLine(afterHyphen, activeDelimiter as any)
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
  const { key, value, followDepth } = decodeFirstFieldOnHyphen(afterHyphen, cursor, baseDepth, options)

  const obj: JsonObject = { [key]: value }

  // Read subsequent fields
  while (!cursor.atEnd()) {
    const line = cursor.peek()
    if (!line || line.depth < followDepth) {
      break
    }

    if (line.depth === followDepth && !line.content.startsWith(LIST_ITEM_PREFIX)) {
      const [k, v] = decodeKeyValuePair(line, cursor, followDepth, options)
      obj[k] = v
    }
    else {
      break
    }
  }

  return obj
}

function decodeFirstFieldOnHyphen(
  rest: string,
  cursor: LineCursor,
  baseDepth: Depth,
  options: ResolvedDecodeOptions,
): { key: string, value: JsonValue, followDepth: Depth } {
  return decodeKeyValue(rest, cursor, baseDepth, options)
}

// #endregion

// #region Validation

function assertExpectedCount(actual: number, expected: number, what: string, options: ResolvedDecodeOptions): void {
  if (options.strict && actual !== expected) {
    throw new RangeError(`Expected ${expected} ${what}, but got ${actual}`)
  }
}

// #endregion
