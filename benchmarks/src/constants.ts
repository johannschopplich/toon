import process from 'node:process'
import * as url from 'node:url'

export const ROOT_DIR: string = url.fileURLToPath(new URL('../../', import.meta.url))
export const BENCHMARKS_DIR: string = url.fileURLToPath(new URL('../', import.meta.url))

/**
 * Default concurrency for parallel evaluations
 */
export const DEFAULT_CONCURRENCY = 20

/**
 * Progress bar configuration
 */
export const PROGRESS_BAR = {
  /** Default width for progress bars */
  defaultWidth: 25,
  /** Compact width for inline displays */
  compactWidth: 20,
} as const

/**
 * Enable dry run mode for quick testing with limited AI requests
 *
 * @remarks
 * Set via environment variable: `DRY_RUN=true`
 */
export const DRY_RUN: boolean = process.env.DRY_RUN === 'true'

/**
 * Limits applied when DRY_RUN is enabled
 */
export const DRY_RUN_LIMITS = {
  /** Maximum number of questions to evaluate */
  maxQuestions: 10,
  /** Maximum number of formats to test */
  maxFormats: undefined as number | undefined,
  /** Models to use in dry run */
  allowedModels: [] as string[],
}
