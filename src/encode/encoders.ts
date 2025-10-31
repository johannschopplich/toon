import type { Depth, JsonArray, JsonObject, JsonPrimitive, JsonValue, ResolvedEncodeOptions } from '../types'
import { LIST_ITEM_MARKER } from '../constants'
import { isArrayOfArrays, isArrayOfObjects, isArrayOfPrimitives, isJsonArray, isJsonObject, isJsonPrimitive } from './normalize'
import { encodeAndJoinPrimitives, encodeKey, encodePrimitive, formatHeader } from './primitives'
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
    const header = formatHeader(0, { key, delimiter: options.delimiter, lengthMarker: options.lengthMarker })
    writer.push(depth, header)
    return
  }

  // Primitive array
  if (isArrayOfPrimitives(value)) {
    const formatted = encodeInlineArrayLine(value, options.delimiter, key, options.lengthMarker)
    writer.push(depth, formatted)
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
    const header = extractTabularHeader(value)
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

// #region Array of arrays (expanded format)

export function encodeArrayOfArraysAsListItems(
  prefix: string | undefined,
  values: readonly JsonArray[],
  writer: LineWriter,
  depth: Depth,
  options: ResolvedEncodeOptions,
): void {
  const header = formatHeader(values.length, { key: prefix, delimiter: options.delimiter, lengthMarker: options.lengthMarker })
  writer.push(depth, header)

  for (const arr of values) {
    if (isArrayOfPrimitives(arr)) {
      const inline = encodeInlineArrayLine(arr, options.delimiter, undefined, options.lengthMarker)
      writer.pushListItem(depth + 1, inline)
    }
  }
}

export function encodeInlineArrayLine(values: readonly JsonPrimitive[], delimiter: string, prefix?: string, lengthMarker?: '#' | false): string {
  const header = formatHeader(values.length, { key: prefix, delimiter, lengthMarker })
  const joinedValue = encodeAndJoinPrimitives(values, delimiter)
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
  const formattedHeader = formatHeader(rows.length, { key: prefix, fields: header, delimiter: options.delimiter, lengthMarker: options.lengthMarker })
  writer.push(depth, `${formattedHeader}`)

  writeTabularRows(rows, header, writer, depth + 1, options)
}

export function extractTabularHeader(rows: readonly JsonObject[]): string[] | undefined {
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
    const joinedValue = encodeAndJoinPrimitives(values as JsonPrimitive[], options.delimiter)
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
  const header = formatHeader(items.length, { key: prefix, delimiter: options.delimiter, lengthMarker: options.lengthMarker })
  writer.push(depth, header)

  for (const item of items) {
    encodeListItemValue(item, writer, depth + 1, options)
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
    writer.pushListItem(depth, `${encodedKey}: ${encodePrimitive(firstValue, options.delimiter)}`)
  }
  else if (isJsonArray(firstValue)) {
    if (isArrayOfPrimitives(firstValue)) {
      // Inline format for primitive arrays
      const formatted = encodeInlineArrayLine(firstValue, options.delimiter, firstKey, options.lengthMarker)
      writer.pushListItem(depth, formatted)
    }
    else if (isArrayOfObjects(firstValue)) {
      // Check if array of objects can use tabular format
      const header = extractTabularHeader(firstValue)
      if (header) {
        // Tabular format for uniform arrays of objects
        const formattedHeader = formatHeader(firstValue.length, { key: firstKey, fields: header, delimiter: options.delimiter, lengthMarker: options.lengthMarker })
        writer.pushListItem(depth, formattedHeader)
        writeTabularRows(firstValue, header, writer, depth + 1, options)
      }
      else {
        // Fall back to list format for non-uniform arrays of objects
        writer.pushListItem(depth, `${encodedKey}[${firstValue.length}]:`)
        for (const item of firstValue) {
          encodeObjectAsListItem(item, writer, depth + 1, options)
        }
      }
    }
    else {
      // Complex arrays on separate lines (array of arrays, etc.)
      writer.pushListItem(depth, `${encodedKey}[${firstValue.length}]:`)

      // Encode array contents at depth + 1
      for (const item of firstValue) {
        encodeListItemValue(item, writer, depth + 1, options)
      }
    }
  }
  else if (isJsonObject(firstValue)) {
    const nestedKeys = Object.keys(firstValue)
    if (nestedKeys.length === 0) {
      writer.pushListItem(depth, `${encodedKey}:`)
    }
    else {
      writer.pushListItem(depth, `${encodedKey}:`)
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

// #region List item encoding helpers

function encodeListItemValue(
  value: JsonValue,
  writer: LineWriter,
  depth: Depth,
  options: ResolvedEncodeOptions,
): void {
  if (isJsonPrimitive(value)) {
    writer.pushListItem(depth, encodePrimitive(value, options.delimiter))
  }
  else if (isJsonArray(value) && isArrayOfPrimitives(value)) {
    const inline = encodeInlineArrayLine(value, options.delimiter, undefined, options.lengthMarker)
    writer.pushListItem(depth, inline)
  }
  else if (isJsonObject(value)) {
    encodeObjectAsListItem(value, writer, depth, options)
  }
}

// #endregion
