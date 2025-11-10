import type { JsonObject, JsonValue } from '../types'
import { DOT } from '../constants'
import { isJsonObject } from '../encode/normalize'
import { isIdentifierSegment } from '../shared/validation'

// #region Path expansion (safe)

/**
 * Checks if two values can be merged (both are plain objects).
 */
function canMerge(a: JsonValue, b: JsonValue): a is JsonObject {
  return isJsonObject(a) && isJsonObject(b)
}

/**
 * Expands dotted keys into nested objects in safe mode.
 *
 * @remarks
 * This function recursively traverses a decoded TOON value and expands any keys
 * containing dots (`.`) into nested object structures, provided all segments
 * are valid identifiers.
 *
 * Expansion rules:
 * - Keys containing dots are split into segments
 * - All segments must pass `isIdentifierSegment` validation
 * - Non-eligible keys (with special characters) are left as literal dotted keys
 * - Deep merge: When multiple dotted keys expand to the same path, their values are merged if both are objects
 * - Conflict handling:
 *   - `strict=true`: Throws TypeError on conflicts (non-object collision)
 *   - `strict=false`: LWW (silent overwrite)
 *
 * @param value - The decoded value to expand
 * @param strict - Whether to throw errors on conflicts
 * @returns The expanded value with dotted keys reconstructed as nested objects
 * @throws TypeError if conflicts occur in strict mode
 */
export function expandPathsSafe(value: JsonValue, strict: boolean): JsonValue {
  if (Array.isArray(value)) {
    // Recursively expand array elements
    return value.map(item => expandPathsSafe(item, strict))
  }

  if (isJsonObject(value)) {
    const result: JsonObject = {}
    const keys = Object.keys(value)

    for (const key of keys) {
      const val = value[key]!

      // Check if key contains dots
      if (key.includes(DOT)) {
        const segments = key.split(DOT)

        // Validate all segments are identifiers
        if (segments.every(seg => isIdentifierSegment(seg))) {
          // Expand this dotted key
          const expandedValue = expandPathsSafe(val, strict)
          insertPathSafe(result, segments, expandedValue, strict)
          continue
        }
      }

      // Not expandable - keep as literal key, but still recursively expand the value
      result[key] = expandPathsSafe(val, strict)
    }

    return result
  }

  // Primitive value - return as-is
  return value
}

/**
 * Inserts a value at a nested path, creating intermediate objects as needed.
 *
 * @remarks
 * This function walks the segment path, creating nested objects as needed.
 * When an existing value is encountered:
 * - If both are objects: deep merge (continue insertion)
 * - If values differ: conflict
 *   - strict=true: throw TypeError
 *   - strict=false: overwrite with new value (last-wins)
 *
 * @param target - The object to insert into
 * @param segments - Array of path segments (e.g., ['data', 'metadata', 'items'])
 * @param value - The value to insert at the end of the path
 * @param strict - Whether to throw on conflicts
 * @throws TypeError if a conflict occurs in strict mode
 */
function insertPathSafe(
  target: JsonObject,
  segments: readonly string[],
  value: JsonValue,
  strict: boolean,
): void {
  let current: JsonObject = target

  // Walk to the penultimate segment, creating objects as needed
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]!
    const existing = current[seg]

    if (existing === undefined) {
      // Create new intermediate object
      const newObj: JsonObject = {}
      current[seg] = newObj
      current = newObj
    }
    else if (isJsonObject(existing)) {
      // Continue into existing object
      current = existing
    }
    else {
      // Conflict: existing value is not an object
      if (strict) {
        throw new TypeError(
          `Path expansion conflict at segment "${seg}": expected object but found ${typeof existing}`,
        )
      }
      // Non-strict: overwrite with new object
      const newObj: JsonObject = {}
      current[seg] = newObj
      current = newObj
    }
  }

  // Insert at the final segment
  const lastSeg = segments[segments.length - 1]!
  const existing = current[lastSeg]

  if (existing === undefined) {
    // No conflict - insert directly
    current[lastSeg] = value
  }
  else if (canMerge(existing, value)) {
    // Both are objects - deep merge
    mergeObjects(existing as JsonObject, value as JsonObject, strict)
  }
  else {
    // Conflict: incompatible types
    if (strict) {
      throw new TypeError(
        `Path expansion conflict at key "${lastSeg}": cannot merge ${typeof existing} with ${typeof value}`,
      )
    }
    // Non-strict: overwrite (LWW)
    current[lastSeg] = value
  }
}

/**
 * Deep merges properties from source into target.
 *
 * @remarks
 * For each key in source:
 * - If key doesn't exist in target: copy it
 * - If both values are objects: recursively merge
 * - Otherwise: conflict (strict throws, non-strict overwrites)
 *
 * @param target - The target object to merge into
 * @param source - The source object to merge from
 * @param strict - Whether to throw on conflicts
 * @throws TypeError if a conflict occurs in strict mode
 */
function mergeObjects(
  target: JsonObject,
  source: JsonObject,
  strict: boolean,
): void {
  for (const key of Object.keys(source)) {
    const sourceValue = source[key]!
    const targetValue = target[key]

    if (targetValue === undefined) {
      // Key doesn't exist in target - copy it
      target[key] = sourceValue
    }
    else if (canMerge(targetValue, sourceValue)) {
      // Both are objects - recursively merge
      mergeObjects(targetValue as JsonObject, sourceValue as JsonObject, strict)
    }
    else {
      // Conflict: incompatible types
      if (strict) {
        throw new TypeError(
          `Path expansion conflict at key "${key}": cannot merge ${typeof targetValue} with ${typeof sourceValue}`,
        )
      }
      // Non-strict: overwrite (LWW)
      target[key] = sourceValue
    }
  }
}

// #endregion
