/**
 * Report generation for TOON benchmarks
 *
 * Handles:
 * - Statistical analysis
 * - Twitter-ready markdown report generation with visual elements
 * - Per-dataset breakdowns
 * - Cost analysis
 * - Result file saving
 */

import type { EvaluationResult, FormatResult, Question } from './types'
import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import { encode } from 'gpt-tokenizer'
import { BENCHMARKS_DIR } from './constants'
import { datasets } from './datasets'
import { models } from './evaluate'

/**
 * Calculate per-format statistics from evaluation results
 */
export function calculateFormatResults(
  results: EvaluationResult[],
  tokenCounts: Record<string, number>,
): FormatResult[] {
  const formatNames = [...new Set(results.map(r => r.format))]

  return formatNames.map((formatName) => {
    const formatResults = results.filter(r => r.format === formatName)
    const correctCount = formatResults.filter(r => r.correct).length
    const totalCount = formatResults.length
    const accuracy = correctCount / totalCount

    // Calculate average tokens across all datasets for this format
    const avgTokens = Object.entries(tokenCounts)
      .filter(([key]) => key.startsWith(`${formatName}-`))
      .reduce((sum, [, tokens]) => sum + tokens, 0) / datasets.length

    const averageLatency = formatResults.reduce((sum, r) => sum + r.latencyMs, 0) / totalCount

    return {
      format: formatName,
      accuracy,
      totalTokens: Math.round(avgTokens),
      averageLatency: Math.round(averageLatency),
      correctCount,
      totalCount,
    }
  }).sort((a, b) => b.accuracy - a.accuracy)
}

/**
 * Generate embeddable markdown report from results
 */
export function generateMarkdownReport(
  formatResults: FormatResult[],
  results: EvaluationResult[],
  questions: Question[],
  tokenCounts: Record<string, number>,
): string {
  const lines: string[] = [
    '### Retrieval Accuracy',
    '',
  ]

  const toon = formatResults.find(r => r.format === 'toon')
  const json = formatResults.find(r => r.format === 'json')

  // Model-by-model breakdown with ASCII bars
  const modelCount = Object.keys(models).length
  lines.push(`Tested across **${modelCount} ${modelCount === 1 ? 'LLM' : 'LLMs'}** with data retrieval tasks:`, '', '```')

  const modelNames = Object.keys(models)
  for (let i = 0; i < modelNames.length; i++) {
    const modelName = modelNames[i]!
    const modelResults = formatResults.map((fr) => {
      const modelFormatResults = results.filter(r => r.model === modelName && r.format === fr.format)
      const correctCount = modelFormatResults.filter(r => r.correct).length
      const totalCount = modelFormatResults.length
      const accuracy = totalCount > 0 ? correctCount / totalCount : 0

      return {
        format: fr.format,
        accuracy,
        correctCount,
        totalCount,
      }
    }).sort((a, b) => b.accuracy - a.accuracy)

    // Add blank line before model name, except for first model
    if (i > 0)
      lines.push('')
    lines.push(modelName)
    for (const result of modelResults) {
      const bar = createProgressBar(result.accuracy, 1, 20)
      const accuracyStr = `${(result.accuracy * 100).toFixed(1)}%`.padStart(6)
      const countStr = `(${result.correctCount}/${result.totalCount})`
      lines.push(`  ${result.format.padEnd(12)} ${bar} ${accuracyStr} ${countStr}`)
    }
  }

  lines.push('```', '')

  // Summary comparison
  if (toon && json) {
    const tokenSavings = ((1 - toon.totalTokens / json.totalTokens) * 100).toFixed(1)
    lines.push(
      `**Tradeoff:** TOON achieves ${(toon.accuracy * 100).toFixed(1)}% accuracy (vs JSON's ${(json.accuracy * 100).toFixed(1)}%) while using ${tokenSavings}% fewer tokens.`,
      '',
    )
  }

  lines.push('<details>', '<summary><strong>View detailed breakdown by dataset and model</strong></summary>', '', '#### Performance by Dataset', '')

  for (const dataset of datasets) {
    lines.push(`##### ${dataset.description}`, '')

    const datasetResults = formatResults.map((fr) => {
      const datasetFormatResults = results.filter(r => r.questionId.includes(dataset.name) || questions.find(q => q.id === r.questionId)?.dataset === dataset.name)
      if (datasetFormatResults.length === 0)
        return undefined

      const formatDatasetResults = datasetFormatResults.filter(r => r.format === fr.format)
      if (formatDatasetResults.length === 0)
        return undefined

      const correctCount = formatDatasetResults.filter(r => r.correct).length
      const totalCount = formatDatasetResults.length
      const accuracy = totalCount > 0 ? correctCount / totalCount : 0

      // Get token count for this dataset+format
      const tokenKey = `${fr.format}-${dataset.name}`
      const tokens = tokenCounts[tokenKey] || fr.totalTokens

      return {
        format: fr.format,
        accuracy,
        tokens,
        correctCount,
        totalCount,
      }
    }).filter(Boolean) as { format: string, accuracy: number, tokens: number, correctCount: number, totalCount: number }[]

    if (datasetResults.length === 0)
      continue

    // Sort by efficiency
    datasetResults.sort((a, b) => {
      const effA = (a.accuracy ** 2) / (a.tokens / 1000)
      const effB = (b.accuracy ** 2) / (b.tokens / 1000)
      return effB - effA
    })

    lines.push(
      '| Format | Accuracy | Tokens | Correct/Total |',
      '|--------|----------|--------|---------------|',
    )

    for (const result of datasetResults.slice(0, 6)) {
      lines.push(
        `| \`${result.format}\` | ${(result.accuracy * 100).toFixed(1)}% | ${result.tokens.toLocaleString()} | ${result.correctCount}/${result.totalCount} |`,
      )
    }

    lines.push('')
  }

  // Model breakdown
  lines.push('#### Performance by Model', '')

  for (const modelName of Object.keys(models)) {
    lines.push(`##### ${modelName}`, '')

    const modelResults = formatResults.map((fr) => {
      const modelFormatResults = results.filter(r => r.model === modelName && r.format === fr.format)
      const correctCount = modelFormatResults.filter(r => r.correct).length
      const totalCount = modelFormatResults.length
      const accuracy = correctCount / totalCount

      return {
        format: fr.format,
        accuracy,
        correctCount,
        totalCount,
      }
    }).sort((a, b) => b.accuracy - a.accuracy)

    lines.push('| Format | Accuracy | Correct/Total |', '|--------|----------|---------------|')

    for (const result of modelResults) {
      lines.push(`| \`${result.format}\` | ${(result.accuracy * 100).toFixed(1)}% | ${result.correctCount}/${result.totalCount} |`)
    }

    lines.push('')
  }

  // Methodology
  lines.push(
    '#### Methodology',
    '',
    '- **Semantic validation**: LLM-as-judge validates responses semantically (not exact string matching).',
    '- **Token counting**: Using `gpt-tokenizer` with `o200k_base` encoding.',
    '- **Question types**: Field retrieval, aggregation, and filtering tasks.',
    '- **Real data**: Faker.js-generated datasets + GitHub repositories.',
    '',
    '</details>',
    '',
  )

  return lines.join('\n')
}

/**
 * Calculate token counts for all format+dataset combinations
 */
export function calculateTokenCounts(
  formatters: Record<string, (data: any) => string>,
): Record<string, number> {
  const tokenCounts: Record<string, number> = {}

  for (const [formatName, formatter] of Object.entries(formatters)) {
    for (const dataset of datasets) {
      const formatted = formatter(dataset.data)
      const key = `${formatName}-${dataset.name}`
      tokenCounts[key] = encode(formatted).length
    }
  }

  return tokenCounts
}

/**
 * Save results to disk
 */
export async function saveResults(
  results: EvaluationResult[],
  formatResults: FormatResult[],
  questions: Question[],
  tokenCounts: Record<string, number>,
): Promise<string> {
  const resultsDir = path.join(BENCHMARKS_DIR, 'results', 'accuracy')
  await fsp.mkdir(resultsDir, { recursive: true })

  // Save raw results
  await fsp.writeFile(
    path.join(resultsDir, 'raw-results.json'),
    `${JSON.stringify(results, undefined, 2)}\n`,
  )

  // Save summary
  await fsp.writeFile(
    path.join(resultsDir, 'summary.json'),
    `${JSON.stringify({
      formatResults,
      questions: questions.length,
      models: Object.keys(models),
      datasets: datasets.map(d => ({ name: d.name, description: d.description })),
      tokenCounts,
      timestamp: new Date().toISOString(),
    }, undefined, 2)}\n`,
  )

  // Generate markdown report
  const report = generateMarkdownReport(formatResults, results, questions, tokenCounts)
  await fsp.writeFile(
    path.join(resultsDir, 'report.md'),
    report,
  )

  return resultsDir
}

/**
 * Generate visual progress bar using ASCII characters (█ for filled, ░ for empty)
 */
function createProgressBar(tokens: number, maxTokens: number, width = 30): string {
  const filled = Math.round((tokens / maxTokens) * width)
  const empty = width - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}
