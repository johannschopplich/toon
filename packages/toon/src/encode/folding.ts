import type { JsonValue, ResolvedEncodeOptions } from '../types'
import { DOT } from '../constants'
import { isIdentifierSegment } from '../shared/validation'
import { isJsonObject } from './normalize'

// #region Key folding helpers

/**
 * Result of attempting to fold a key chain.
 */
export interface FoldResult {
  /**
   * The folded key with dot-separated segments (e.g., "data.metadata.items")
   */
  foldedKey: string
  /**
   * The remainder value after folding:
   * - `undefined` if the chain was fully folded to a leaf (primitive, array, or empty object)
   * - An object if the chain was partially folded (depth limit reached with nested tail)
   */
  remainder?: JsonValue
  /**
   * The leaf value at the end of the folded chain.
   * Used to avoid redundant traversal when encoding the folded value.
   */
  leafValue: JsonValue
}

/**
 * Attempts to fold a single-key object chain into a dotted path.
 *
 * @remarks
 * Folding traverses nested objects with single keys, collapsing them into a dotted path.
 * It stops when:
 * - A non-single-key object is encountered
 * - An array is encountered (arrays are not "single-key objects")
 * - A primitive value is reached
 * - The flatten depth limit is reached
 * - Any segment fails safe mode validation
 *
 * Safe mode requirements:
 * - `options.keyFolding` must be `'safe'`
 * - Every segment must be a valid identifier (no dots, no special chars)
 * - The folded key must not collide with existing sibling keys
 * - No segment should require quoting
 *
 * @param key - The starting key to fold
 * @param value - The value associated with the key
 * @param siblings - Array of all sibling keys at this level (for collision detection)
 * @param options - Resolved encoding options
 * @returns A FoldResult if folding is possible, undefined otherwise
 */
export function tryFoldKeyChain(
  key: string,
  value: JsonValue,
  siblings: readonly string[],
  options: ResolvedEncodeOptions,
): FoldResult | undefined {
  // Only fold when safe mode is enabled
  if (options.keyFolding !== 'safe') {
    return undefined
  }

  // Can only fold objects
  if (!isJsonObject(value)) {
    return undefined
  }

  // Collect the chain of single-key objects
  const { segments, tail, leafValue } = collectSingleKeyChain(key, value, options.flattenDepth)

  // Need at least 2 segments for folding to be worthwhile
  if (segments.length < 2) {
    return undefined
  }

  // Validate all segments are safe identifiers
  if (!segments.every(seg => isIdentifierSegment(seg))) {
    return undefined
  }

  // Build the folded key
  const foldedKey = buildFoldedKey(segments)

  // Check for collision with existing literal sibling keys (inline check)
  if (siblings.includes(foldedKey)) {
    return undefined
  }

  return {
    foldedKey,
    remainder: tail,
    leafValue,
  }
}

/**
 * Collects a chain of single-key objects into segments.
 *
 * @remarks
 * Traverses nested objects, collecting keys until:
 * - A non-single-key object is found
 * - An array is encountered
 * - A primitive is reached
 * - An empty object is reached
 * - The depth limit is reached
 *
 * @param startKey - The initial key to start the chain
 * @param startValue - The value to traverse
 * @param maxDepth - Maximum number of segments to collect
 * @returns Object containing segments array, tail value, and leaf value
 */
function collectSingleKeyChain(
  startKey: string,
  startValue: JsonValue,
  maxDepth: number,
): { segments: string[], tail: JsonValue | undefined, leafValue: JsonValue } {
  const segments: string[] = [startKey]
  let current = startValue

  while (segments.length < maxDepth) {
    // Must be an object to continue
    if (!isJsonObject(current)) {
      break
    }

    const keys = Object.keys(current)

    // Must have exactly one key to continue the chain
    if (keys.length !== 1) {
      break
    }

    const nextKey = keys[0]!
    const nextValue = current[nextKey]!

    segments.push(nextKey)
    current = nextValue
  }

  // Determine the tail - simplified with early returns
  if (!isJsonObject(current)) {
    // Array, primitive, or null - this is a leaf value
    return { segments, tail: undefined, leafValue: current }
  }

  const keys = Object.keys(current)

  if (keys.length === 0) {
    // Empty object is a leaf
    return { segments, tail: undefined, leafValue: current }
  }

  if (keys.length === 1 && segments.length === maxDepth) {
    // Hit depth limit with remaining chain
    return { segments, tail: current, leafValue: current }
  }

  // Multi-key object is the remainder
  return { segments, tail: current, leafValue: current }
}

/**
 * Builds a folded key from segments.
 *
 * @param segments - Array of key segments
 * @returns Dot-separated key string
 */
function buildFoldedKey(segments: readonly string[]): string {
  return segments.join(DOT)
}

// #endregion
