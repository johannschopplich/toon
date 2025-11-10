import { FALSE_LITERAL, NULL_LITERAL, TRUE_LITERAL } from '../constants'

export function isBooleanOrNullLiteral(token: string): boolean {
  return token === TRUE_LITERAL || token === FALSE_LITERAL || token === NULL_LITERAL
}

/**
 * Checks if a token represents a valid numeric literal.
 *
 * @remarks
 * Rejects numbers with leading zeros (except `"0"` itself or decimals like `"0.5"`).
 */
export function isNumericLiteral(token: string): boolean {
  if (!token)
    return false

  // Must not have leading zeros (except for `"0"` itself or decimals like `"0.5"`)
  if (token.length > 1 && token[0] === '0' && token[1] !== '.') {
    return false
  }

  // Check if it's a valid number
  const numericValue = Number(token)
  return !Number.isNaN(numericValue) && Number.isFinite(numericValue)
}
