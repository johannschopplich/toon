import process from 'node:process'
import * as url from 'node:url'

export const ROOT_DIR: string = url.fileURLToPath(new URL('../../', import.meta.url))
export const BENCHMARKS_DIR: string = url.fileURLToPath(new URL('../', import.meta.url))

/**
 * Model-specific RPM (requests per minute) limits to handle API quotas
 *
 * @remarks
 * Set `undefined` for models without specific limits.
 */
/// keep-sorted
export const MODEL_RPM_LIMITS: Record<string, number | undefined> = {
  'claude-haiku-4-5-20251001': 50,
  'gemini-2.5-flash': 25,
  'gpt-5-nano': 50,
  'grok-4-fast-non-reasoning': 50,
}

/**
 * Default concurrency for parallel evaluations to prevent bursting
 */
export const DEFAULT_CONCURRENCY = 10

/**
 * Display names for data format types
 */
export const FORMATTER_DISPLAY_NAMES: Record<string, string> = {
  'json-pretty': 'JSON',
  'json-compact': 'JSON compact',
  'toon': 'TOON',
  'csv': 'CSV',
  'xml': 'XML',
  'yaml': 'YAML',
} as const

/**
 * Enable dry run mode for quick testing with limited AI requests
 *
 * @remarks
 * Set via environment variable: `DRY_RUN=true`.
 */
export const DRY_RUN: boolean = process.env.DRY_RUN === 'true'

/**
 * Limits applied during dry run mode
 */
export const DRY_RUN_LIMITS = {
  /** Maximum number of questions to evaluate */
  maxQuestions: 10,
}

/**
 * Threshold values for filtering and aggregation questions
 */
export const QUESTION_THRESHOLDS = {
  tabular: {
    salaryRanges: [60000, 80000, 100000, 120000],
    experienceYears: [5, 10, 15, 20],
    departmentSalaryThreshold: 80000,
    departmentExperienceThreshold: 10,
  },
  nested: {
    highValueOrders: [200, 400, 600],
    statusValueThreshold: 300,
    itemCountThreshold: 3,
    totalThresholdsForItems: [300, 500],
  },
  analytics: {
    views: [5000, 7000],
    conversions: [10, 30],
    viewsForFiltering: [6000, 7000],
    conversionsForFiltering: 15,
    revenueThresholds: [500, 1000, 1500, 2000, 2500],
    viewsThresholdForRevenue: 6000,
    clicksForFiltering: [250, 400],
    conversionsForClickFiltering: 15,
    revenueForBounceRate: [1000, 1500],
    bounceRateThreshold: 0.5,
  },
  github: {
    stars: [100000, 150000, 200000],
    forks: [20000, 35000, 50000],
    watchers: [5000, 8000],
    starForkCombinations: [
      { stars: 75000, forks: 15000 },
      { stars: 100000, forks: 20000 },
      { stars: 150000, forks: 30000 },
      { stars: 200000, forks: 45000 },
    ],
    starWatcherCombinations: [
      { stars: 100000, watchers: 7000 },
      { stars: 150000, watchers: 9000 },
    ],
  },
} as const

/**
 * Question generation configuration
 */
export const QUESTION_LIMITS = {
  tabular: {
    fieldRetrieval: 20,
    aggregationDepartments: 6,
    filteringMultiConditionDepartments: 6,
    filteringExperience: 4,
    filteringDepartmentExp: 3,
    filteringDepartmentActive: 3,
  },
  nested: {
    fieldRetrievalOrders: 8,
    fieldRetrievalCustomers: 10,
    aggregationStatuses: 5,
    filteringStatusAndValue: 5,
    filteringStatusAndItems: 3,
  },
  analytics: {
    fieldRetrievalDates: 13,
  },
  github: {
    fieldRetrievalRepos: 11,
    aggregationBranches: 2,
    filteringStarsAndForks: 8,
  },
  eventLogs: {
    fieldRetrieval: 10,
    aggregationEndpoints: 3,
    filteringLevelAndStatus: 2,
    filteringEndpointAndStatus: 2,
  },
  nestedConfig: {
    fieldRetrieval: 5,
    filteringComplex: 2,
  },
} as const
