/**
 * LLM Retrieval Accuracy Benchmark
 *
 * Main entry point that orchestrates the full benchmark:
 * 1. Generate questions from datasets
 * 2. Format data in all formats (JSON, TOON, YAML, Markdown-kv)
 * 3. Evaluate each question with each format using LLMs
 * 4. Generate reports
 */

import type { EvaluationResult, Question } from '../src/types'
import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import { consola } from 'consola'
import pMap from 'p-map'
import { BENCHMARKS_DIR, DEFAULT_CONCURRENCY, DRY_RUN, DRY_RUN_LIMITS, ROOT_DIR } from '../src/constants'
import { datasets } from '../src/datasets'
import { evaluateQuestion, models } from '../src/evaluate'
import { formatters } from '../src/formatters'
import { generateQuestions } from '../src/questions'
import { calculateFormatResults, calculateTokenCounts, saveResults } from '../src/report'

consola.start('Retrieval Accuracy Benchmark for TOON')

// Check if results already exist
const resultsDir = path.join(BENCHMARKS_DIR, 'results', 'accuracy')
const rawResultsPath = path.join(resultsDir, 'raw-results.json')
const summaryPath = path.join(resultsDir, 'summary.json')

let existingResults: EvaluationResult[] | undefined
let existingTokenCounts: Record<string, number> | undefined

try {
  const [rawData, summaryData] = await Promise.all([
    fsp.readFile(rawResultsPath, 'utf-8'),
    fsp.readFile(summaryPath, 'utf-8'),
  ])
  existingResults = JSON.parse(rawData)
  const summary = JSON.parse(summaryData)
  existingTokenCounts = summary.tokenCounts
  consola.info('Found existing results – regenerating report only')
}
catch {
  // Results don't exist, will run full evaluation
}

if (DRY_RUN) {
  consola.info('Limiting questions and models for dry run')
}

let questions = generateQuestions()

// Apply dry run limits if enabled
if (DRY_RUN && DRY_RUN_LIMITS.maxQuestions) {
  questions = questions.slice(0, DRY_RUN_LIMITS.maxQuestions)
}

// Filter models for dry run
const activeModels = DRY_RUN && DRY_RUN_LIMITS.allowedModels.length > 0
  ? Object.fromEntries(
      Object.entries(models).filter(([name]) => DRY_RUN_LIMITS.allowedModels.includes(name)),
    )
  : models

let results: EvaluationResult[]
let tokenCounts: Record<string, number>

if (existingResults && existingTokenCounts) {
  // Reuse existing results
  results = existingResults
  tokenCounts = existingTokenCounts
}
else {
  // Run full evaluation
  consola.info(`Evaluating ${questions.length} questions`)
  consola.info(`Testing ${Object.keys(formatters).length} formats`)
  consola.info(`Using ${Object.keys(activeModels).length} models: ${Object.keys(activeModels).join(', ')}`)

  // Calculate token counts for all format+dataset combinations
  tokenCounts = calculateTokenCounts(formatters)

  // Generate evaluation tasks
  const tasks: { question: Question, formatName: string, modelName: string }[] = []

  for (const question of questions) {
    for (const [formatName] of Object.entries(formatters)) {
      for (const [modelName] of Object.entries(activeModels)) {
        tasks.push({ question, formatName, modelName })
      }
    }
  }

  const total = tasks.length
  consola.start(`Running ${total} evaluations with concurrency: ${DEFAULT_CONCURRENCY}`)

  results = await pMap(
    tasks,
    async (task, index) => {
      // Format data on-demand
      const dataset = datasets.find(d => d.name === task.question.dataset)!
      const formatter = formatters[task.formatName]!
      const formattedData = formatter(dataset.data)
      const model = activeModels[task.modelName as keyof typeof activeModels]!

      const result = await evaluateQuestion({
        question: task.question,
        formatName: task.formatName,
        formattedData,
        model,
        modelName: task.modelName,
      })

      // Progress update after task completes
      if ((index + 1) % 10 === 0 || (index + 1) === total) {
        const percent = (((index + 1) / total) * 100).toFixed(1)
        consola.start(`Progress: ${index + 1}/${total} (${percent}%)`)
      }

      return result
    },
    { concurrency: DEFAULT_CONCURRENCY },
  )

  consola.success('Evaluation complete!')
}

// Generate/regenerate markdown report
consola.start('Generating report and saving results…')
const formatResults = calculateFormatResults(results, tokenCounts)
await saveResults(results, formatResults, questions, tokenCounts)

consola.info(`Results saved to: \`${path.relative(ROOT_DIR, resultsDir)}\``)
consola.success(existingResults ? 'Markdown report regenerated!' : 'Evaluation complete!')
