import type { JsonValue, JsonObject } from '../types'
import { isJsonArray, isJsonObject, isJsonPrimitive } from './normalize'


/**
 * Recursively flattens a JSON object or array into a single-level object.
 *
 * @param value - The JSON object or array to flatten.
 * @param parentKey - The key to use as the prefix for the current level of flattening. Defaults to an empty string.
 * @param delimiter - The delimiter to use when combining parent keys and child keys. Defaults to '.'.
 * @returns A single-level object containing all the keys and values from the input JSON object or array.
 */
export function flattenJson(
  value: JsonValue,
  maxDepth = 3,
  currentDepth = 0,
  parentKey = '',
  delimiter = '.',
): JsonObject {
  const result: JsonObject = {}

  if (isJsonPrimitive(value)) {
    if (parentKey) result[parentKey] = value
    return result
  }

  if (isJsonArray(value)) {
    value.forEach((item, i) => {
      const key = parentKey ? `${parentKey}${delimiter}${i}` : String(i)
      if (currentDepth < maxDepth)
        Object.assign(result, flattenJson(item, maxDepth, currentDepth + 1, key, delimiter))
      else
        result[key] = item
    })
    return result
  }

  if (isJsonObject(value)) {
    for (const [k, v] of Object.entries(value)) {
      const key = parentKey ? `${parentKey}${delimiter}${k}` : k
      if (currentDepth < maxDepth)
        Object.assign(result, flattenJson(v, maxDepth, currentDepth + 1, key, delimiter))
      else
        result[key] = v
    }
  }

  return result
}


/**
 * Checks if a given JSON value is deeply nested, i.e., it contains a nested
 * object or array at least 3 levels deep.
 *
 * @param value - The JSON value to check for deep nesting.
 * @param depth - The current depth of the value. Defaults to 0.
 * @returns `true` if the value is deeply nested, `false` otherwise.
 */
export function isDeeplyNested(value: JsonValue, depth = 0): boolean {
  if (depth > 2) return true
  if (isJsonArray(value)) return value.some(i => isDeeplyNested(i, depth + 1))
  if (isJsonObject(value)) return Object.values(value).some(v => isDeeplyNested(v, depth + 1))
  return false
}
