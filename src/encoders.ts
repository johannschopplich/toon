import type {
  Depth,
  JsonArray,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  ResolvedEncodeOptions,
} from './types'
import { LIST_ITEM_MARKER, LIST_ITEM_PREFIX } from './constants'
import {
  isArrayOfArrays,
  isArrayOfObjects,
  isArrayOfPrimitives,
  isJsonArray,
  isJsonObject,
  isJsonPrimitive,
} from './normalize'
import {
  encodeKey,
  encodePrimitive,
  formatHeader,
  joinEncodedValues,
} from './primitives'
import { LineWriter } from './writer'

// #region Encode normalized JsonValue

export function encodeValue(value: JsonValue, options: ResolvedEncodeOptions): string {
  if (isJsonPrimitive(value)) {
    return encodePrimitive(value, options.delimiter)
  }

  const writer = new LineWriter(options.indent)

  if (isJsonArray(value)) {
    encodeArray(undefined, value, writer, 0, options)
  }
  else if (isJsonObject(value)) {
    encodeObject(value, writer, 0, options)
  }

  return writer.toString()
}

// #endregion

// #region Object encoding

export function encodeObject(value: JsonObject, writer: LineWriter, depth: Depth, options: ResolvedEncodeOptions): void {
  const keys = Object.keys(value)

  for (const key of keys) {
    encodeKeyValuePair(key, value[key]!, writer, depth, options)
  }
}

export function encodeKeyValuePair(key: string, value: JsonValue, writer: LineWriter, depth: Depth, options: ResolvedEncodeOptions): void {
  const encodedKey = encodeKey(key)

  if (isJsonPrimitive(value)) {
    writer.push(depth, `${encodedKey}: ${encodePrimitive(value, options.delimiter)}`)
  }
  else if (isJsonArray(value)) {
    encodeArray(key, value, writer, depth, options)
  }
  else if (isJsonObject(value)) {
    const nestedKeys = Object.keys(value)
    if (nestedKeys.length === 0) {
      // Empty object
      writer.push(depth, `${encodedKey}:`)
    }
    else {
      writer.push(depth, `${encodedKey}:`)
      encodeObject(value, writer, depth + 1, options)
    }
  }
}

// #endregion

// #region Array encoding

export function encodeArray(
  key: string | undefined,
  value: JsonArray,
  writer: LineWriter,
  depth: Depth,
  options: ResolvedEncodeOptions,
): void {
  if (value.length === 0) {
    const header = formatHeader(0, key ? { key, delimiter: options.delimiter } : { delimiter: options.delimiter })
    writer.push(depth, header)
    return
  }

  // Primitive array
  if (isArrayOfPrimitives(value)) {
    encodeInlinePrimitiveArray(key, value, writer, depth, options)
    return
  }

  // Array of arrays (all primitives)
  if (isArrayOfArrays(value)) {
    const allPrimitiveArrays = value.every(arr => isArrayOfPrimitives(arr))
    if (allPrimitiveArrays) {
      encodeArrayOfArraysAsListItems(key, value, writer, depth, options)
      return
    }
  }

  // Array of objects
  if (isArrayOfObjects(value)) {
    const header = detectTabularHeader(value)
    if (header) {
      encodeArrayOfObjectsAsTabular(key, value, header, writer, depth, options)
    }
    else {
      encodeMixedArrayAsListItems(key, value, writer, depth, options)
    }
    return
  }

  // Mixed array: fallback to expanded format
  encodeMixedArrayAsListItems(key, value, writer, depth, options)
}

// #endregion

// #region Primitive array encoding (inline)

export function encodeInlinePrimitiveArray(
  prefix: string | undefined,
  values: readonly JsonPrimitive[],
  writer: LineWriter,
  depth: Depth,
  options: ResolvedEncodeOptions,
): void {
  const formatted = formatInlineArray(values, options.delimiter, prefix)
  writer.push(depth, formatted)
}

// #endregion

// #region Array of arrays (expanded format)

export function encodeArrayOfArraysAsListItems(
  prefix: string | undefined,
  values: readonly JsonArray[],
  writer: LineWriter,
  depth: Depth,
  options: ResolvedEncodeOptions,
): void {
  const header = formatHeader(values.length, prefix ? { key: prefix, delimiter: options.delimiter } : { delimiter: options.delimiter })
  writer.push(depth, header)

  for (const arr of values) {
    if (isArrayOfPrimitives(arr)) {
      const inline = formatInlineArray(arr, options.delimiter)
      writer.push(depth + 1, `${LIST_ITEM_PREFIX}${inline}`)
    }
  }
}

export function formatInlineArray(values: readonly JsonPrimitive[], delimiter: string, prefix?: string): string {
  const header = formatHeader(values.length, prefix ? { key: prefix, delimiter } : { delimiter })
  const joinedValue = joinEncodedValues(values, delimiter)
  // Only add space if there are values
  if (values.length === 0) {
    return header
  }
  return `${header} ${joinedValue}`
}

// #endregion

// #region Array of objects (tabular format)

export function encodeArrayOfObjectsAsTabular(
  prefix: string | undefined,
  rows: readonly JsonObject[],
  header: readonly string[],
  writer: LineWriter,
  depth: Depth,
  options: ResolvedEncodeOptions,
): void {
  const headerStr = formatHeader(rows.length, { key: prefix, fields: header, delimiter: options.delimiter })
  writer.push(depth, `${headerStr}`)

  writeTabularRows(rows, header, writer, depth + 1, options)
}

export function detectTabularHeader(rows: readonly JsonObject[]): string[] | undefined {
  if (rows.length === 0)
    return

  const firstRow = rows[0]!
  const firstKeys = Object.keys(firstRow)
  if (firstKeys.length === 0)
    return

  if (isTabularArray(rows, firstKeys)) {
    return firstKeys
  }
}

export function isTabularArray(
  rows: readonly JsonObject[],
  header: readonly string[],
): boolean {
  for (const row of rows) {
    const keys = Object.keys(row)

    // All objects must have the same keys (but order can differ)
    if (keys.length !== header.length) {
      return false
    }

    // Check that all header keys exist in the row and all values are primitives
    for (const key of header) {
      if (!(key in row)) {
        return false
      }
      if (!isJsonPrimitive(row[key])) {
        return false
      }
    }
  }

  return true
}

function writeTabularRows(
  rows: readonly JsonObject[],
  header: readonly string[],
  writer: LineWriter,
  depth: Depth,
  options: ResolvedEncodeOptions,
): void {
  for (const row of rows) {
    const values = header.map(key => row[key])
    const joinedValue = joinEncodedValues(values as JsonPrimitive[], options.delimiter)
    writer.push(depth, joinedValue)
  }
}

// #endregion

// #region Array of objects (expanded format)

export function encodeMixedArrayAsListItems(
  prefix: string | undefined,
  items: readonly JsonValue[],
  writer: LineWriter,
  depth: Depth,
  options: ResolvedEncodeOptions,
): void {
  const header = formatHeader(items.length, prefix ? { key: prefix, delimiter: options.delimiter } : { delimiter: options.delimiter })
  writer.push(depth, header)

  for (const item of items) {
    if (isJsonPrimitive(item)) {
      // Direct primitive as list item
      writer.push(depth + 1, `${LIST_ITEM_PREFIX}${encodePrimitive(item, options.delimiter)}`)
    }
    else if (isJsonArray(item)) {
      // Direct array as list item
      if (isArrayOfPrimitives(item)) {
        const inline = formatInlineArray(item, options.delimiter)
        writer.push(depth + 1, `${LIST_ITEM_PREFIX}${inline}`)
      }
    }
    else if (isJsonObject(item)) {
      // Object as list item
      encodeObjectAsListItem(item, writer, depth + 1, options)
    }
  }
}

export function encodeObjectAsListItem(obj: JsonObject, writer: LineWriter, depth: Depth, options: ResolvedEncodeOptions): void {
  const keys = Object.keys(obj)
  if (keys.length === 0) {
    writer.push(depth, LIST_ITEM_MARKER)
    return
  }

  // First key-value on the same line as "- "
  const firstKey = keys[0]!
  const encodedKey = encodeKey(firstKey)
  const firstValue = obj[firstKey]!

  if (isJsonPrimitive(firstValue)) {
    writer.push(depth, `${LIST_ITEM_PREFIX}${encodedKey}: ${encodePrimitive(firstValue, options.delimiter)}`)
  }
  else if (isJsonArray(firstValue)) {
    if (isArrayOfPrimitives(firstValue)) {
      // Inline format for primitive arrays
      const formatted = formatInlineArray(firstValue, options.delimiter, firstKey)
      writer.push(depth, `${LIST_ITEM_PREFIX}${formatted}`)
    }
    else if (isArrayOfObjects(firstValue)) {
      // Check if array of objects can use tabular format
      const header = detectTabularHeader(firstValue)
      if (header) {
        // Tabular format for uniform arrays of objects
        const headerStr = formatHeader(firstValue.length, { key: firstKey, fields: header, delimiter: options.delimiter })
        writer.push(depth, `${LIST_ITEM_PREFIX}${headerStr}`)
        writeTabularRows(firstValue, header, writer, depth + 1, options)
      }
      else {
        // Fall back to list format for non-uniform arrays of objects
        writer.push(depth, `${LIST_ITEM_PREFIX}${encodedKey}[${firstValue.length}]:`)
        for (const item of firstValue) {
          encodeObjectAsListItem(item, writer, depth + 1, options)
        }
      }
    }
    else {
      // Complex arrays on separate lines (array of arrays, etc.)
      writer.push(depth, `${LIST_ITEM_PREFIX}${encodedKey}[${firstValue.length}]:`)

      // Encode array contents at depth + 1
      for (const item of firstValue) {
        if (isJsonPrimitive(item)) {
          writer.push(depth + 1, `${LIST_ITEM_PREFIX}${encodePrimitive(item, options.delimiter)}`)
        }
        else if (isJsonArray(item) && isArrayOfPrimitives(item)) {
          const inline = formatInlineArray(item, options.delimiter)
          writer.push(depth + 1, `${LIST_ITEM_PREFIX}${inline}`)
        }
        else if (isJsonObject(item)) {
          encodeObjectAsListItem(item, writer, depth + 1, options)
        }
      }
    }
  }
  else if (isJsonObject(firstValue)) {
    const nestedKeys = Object.keys(firstValue)
    if (nestedKeys.length === 0) {
      writer.push(depth, `${LIST_ITEM_PREFIX}${encodedKey}:`)
    }
    else {
      writer.push(depth, `${LIST_ITEM_PREFIX}${encodedKey}:`)
      encodeObject(firstValue, writer, depth + 2, options)
    }
  }

  // Remaining keys on indented lines
  for (let i = 1; i < keys.length; i++) {
    const key = keys[i]!
    encodeKeyValuePair(key, obj[key]!, writer, depth + 1, options)
  }
}

// #endregion
