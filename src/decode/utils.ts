import { BACKSLASH, DOUBLE_QUOTE } from '../constants'

/**
 * Finds the index of the closing double quote in a string, accounting for escape sequences.
 *
 * @param content The string to search in
 * @param start The index of the opening quote
 * @returns The index of the closing quote, or -1 if not found
 */
export function findClosingQuote(content: string, start: number): number {
  let i = start + 1
  while (i < content.length) {
    if (content[i] === BACKSLASH && i + 1 < content.length) {
      // Skip escaped character
      i += 2
      continue
    }
    if (content[i] === DOUBLE_QUOTE) {
      return i
    }
    i++
  }
  return -1 // Not found
}

/**
 * Checks if a string contains a specific character outside of quoted sections.
 *
 * @param content The string to check
 * @param char The character to look for
 * @returns true if the character exists outside quotes, false otherwise
 */
export function hasUnquotedChar(content: string, char: string): boolean {
  return findUnquotedChar(content, char) !== -1
}

/**
 * Finds the index of a specific character outside of quoted sections.
 *
 * @param content The string to search in
 * @param char The character to look for
 * @param start Optional starting index (defaults to 0)
 * @returns The index of the character, or -1 if not found outside quotes
 */
export function findUnquotedChar(content: string, char: string, start = 0): number {
  let inQuotes = false
  let i = start

  while (i < content.length) {
    if (content[i] === BACKSLASH && i + 1 < content.length && inQuotes) {
      // Skip escaped character
      i += 2
      continue
    }

    if (content[i] === DOUBLE_QUOTE) {
      inQuotes = !inQuotes
      i++
      continue
    }

    if (content[i] === char && !inQuotes) {
      return i
    }

    i++
  }

  return -1
}

/**
 * Checks if a string starts and ends with double quotes.
 *
 * @param content The string to check
 * @returns true if the string is quoted, false otherwise
 */
export function isQuotedString(content: string): boolean {
  const trimmed = content.trim()
  return trimmed.startsWith(DOUBLE_QUOTE) && trimmed.endsWith(DOUBLE_QUOTE) && trimmed.length >= 2
}

/**
 * Skips whitespace characters starting from a given index.
 *
 * @param content The string to process
 * @param start The starting index
 * @returns The index of the first non-whitespace character, or content.length if all whitespace
 */
export function skipWhitespace(content: string, start: number): number {
  let i = start
  while (i < content.length && /\s/.test(content[i]!)) {
    i++
  }
  return i
}
