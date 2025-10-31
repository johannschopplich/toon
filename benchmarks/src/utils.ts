import * as fsp from 'node:fs/promises'
import { encode } from 'gpt-tokenizer'

/**
 * Generate visual progress bar using ASCII characters
 *
 * @param value - Current value
 * @param max - Maximum value
 * @param width - Width of the bar in characters (default: 25)
 * @returns ASCII progress bar string (`█` for filled, `░` for empty)
 *
 * @example
 * createProgressBar(75, 100, 20) // "███████████████░░░░░"
 * createProgressBar(0.5, 1, 10)  // "█████░░░░░"
 */
export function createProgressBar(value: number, max: number, width = 25): string {
  const filled = Math.round((value / max) * width)
  const empty = width - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

/**
 * Count tokens in text using gpt-tokenizer (o200k_base encoding)
 *
 * @param text - Text to tokenize
 * @returns Number of tokens
 *
 * @example
 * tokenize("Hello, world!") // 4
 */
export function tokenize(text: string): number {
  return encode(text).length
}

/**
 * Ensure a directory exists, creating it recursively if needed
 *
 * @param dirPath - Directory path to ensure exists
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fsp.mkdir(dirPath, { recursive: true })
}
