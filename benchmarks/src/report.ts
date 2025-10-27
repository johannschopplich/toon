/**
 * Report generation for TOON benchmarks
 *
 * Handles:
 * - Statistical analysis
 * - Markdown report generation with visual elements
 * - Per-dataset breakdowns
 * - Cost analysis
 * - Result file saving
 */

import type { EvaluationResult, FormatResult, Question } from './types'
import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import { BENCHMARKS_DIR } from './constants'
import { datasets } from './datasets'
import { models } from './evaluate'
import { createProgressBar, ensureDir, saveJsonFile, tokenize } from './utils'

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
    const correctCount = formatResults.filter(r => r.isCorrect).length
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
  const toon = formatResults.find(r => r.format === 'toon')
  const json = formatResults.find(r => r.format === 'json')

  // Build model-by-model breakdown with ASCII bars
  const modelCount = Object.keys(models).length
  const modelNames = Object.keys(models)

  const modelBreakdown = modelNames.map((modelName, i) => {
    const modelResults = formatResults.map((fr) => {
      const modelFormatResults = results.filter(r => r.model === modelName && r.format === fr.format)
      const correctCount = modelFormatResults.filter(r => r.isCorrect).length
      const totalCount = modelFormatResults.length
      const accuracy = totalCount > 0 ? correctCount / totalCount : 0

      return {
        format: fr.format,
        accuracy,
        correctCount,
        totalCount,
      }
    }).sort((a, b) => b.accuracy - a.accuracy)

    const formatLines = modelResults.map((result) => {
      const bar = createProgressBar(result.accuracy, 1, 20)
      const accuracyStr = `${(result.accuracy * 100).toFixed(1)}%`.padStart(6)
      const countStr = `(${result.correctCount}/${result.totalCount})`
      return `  ${result.format.padEnd(12)} ${bar} ${accuracyStr} ${countStr}`
    }).join('\n')

    // Add blank line before model name, except for first model
    return `${i > 0 ? '\n' : ''}${modelName}\n${formatLines}`
  }).join('\n')

  // Build summary comparison
  const summaryComparison = toon && json
    ? `**Advantage:** TOON achieves **${(toon.accuracy * 100).toFixed(1)}% accuracy** (vs JSON's ${(json.accuracy * 100).toFixed(1)}%) while using **${((1 - toon.totalTokens / json.totalTokens) * 100).toFixed(1)}% fewer tokens**.`
    : ''

  // Build performance by dataset
  const datasetBreakdown = datasets.map((dataset) => {
    const datasetResults = formatResults.map((fr) => {
      const datasetFormatResults = results.filter(r => r.questionId.includes(dataset.name) || questions.find(q => q.id === r.questionId)?.dataset === dataset.name)
      if (datasetFormatResults.length === 0)
        return undefined

      const formatDatasetResults = datasetFormatResults.filter(r => r.format === fr.format)
      if (formatDatasetResults.length === 0)
        return undefined

      const correctCount = formatDatasetResults.filter(r => r.isCorrect).length
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
      return ''

    // Sort by efficiency
    datasetResults.sort((a, b) => {
      const effA = (a.accuracy ** 2) / (a.tokens / 1000)
      const effB = (b.accuracy ** 2) / (b.tokens / 1000)
      return effB - effA
    })

    const tableRows = datasetResults.slice(0, 6).map(result =>
      `| \`${result.format}\` | ${(result.accuracy * 100).toFixed(1)}% | ${result.tokens.toLocaleString()} | ${result.correctCount}/${result.totalCount} |`,
    ).join('\n')

    return `
##### ${dataset.description}

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
${tableRows}
`.trimStart()
  }).filter(Boolean).join('\n')

  // Build performance by model
  const modelPerformance = modelNames.map((modelName) => {
    const modelResults = formatResults.map((fr) => {
      const modelFormatResults = results.filter(r => r.model === modelName && r.format === fr.format)
      const correctCount = modelFormatResults.filter(r => r.isCorrect).length
      const totalCount = modelFormatResults.length
      const accuracy = correctCount / totalCount

      return {
        format: fr.format,
        accuracy,
        correctCount,
        totalCount,
      }
    }).sort((a, b) => b.accuracy - a.accuracy)

    const tableRows = modelResults.map(result =>
      `| \`${result.format}\` | ${(result.accuracy * 100).toFixed(1)}% | ${result.correctCount}/${result.totalCount} |`,
    ).join('\n')

    return `
##### ${modelName}

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
${tableRows}
`.trimStart()
  }).join('\n')

  return `
### Retrieval Accuracy

Tested across **${modelCount} ${modelCount === 1 ? 'LLM' : 'LLMs'}** with data retrieval tasks:

\`\`\`
${modelBreakdown}
\`\`\`

${summaryComparison}

<details>
<summary><strong>View detailed breakdown by dataset and model</strong></summary>

#### Performance by Dataset

${datasetBreakdown}
#### Performance by Model

${modelPerformance}
#### Methodology

- **Semantic validation**: LLM-as-judge validates responses semantically (not exact string matching).
- **Token counting**: Using \`gpt-tokenizer\` with \`o200k_base\` encoding.
- **Question types**: ~160 questions across field retrieval, aggregation, and filtering tasks.
- **Datasets**: Faker.js-generated datasets (seeded) + GitHub repositories.

</details>
`.trimStart()
}

/**
 * Calculate token counts for all format+dataset combinations
 */
export function calculateTokenCounts(
  formatters: Record<string, (data: unknown) => string>,
): Record<string, number> {
  const tokenCounts: Record<string, number> = {}

  for (const [formatName, formatter] of Object.entries(formatters)) {
    for (const dataset of datasets) {
      const formatted = formatter(dataset.data)
      const key = `${formatName}-${dataset.name}`
      tokenCounts[key] = tokenize(formatted)
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
  await ensureDir(resultsDir)

  // Save raw results
  await saveJsonFile(path.join(resultsDir, 'raw-results.json'), results)

  // Save summary
  await saveJsonFile(
    path.join(resultsDir, 'summary.json'),
    {
      formatResults,
      questions: questions.length,
      models: Object.keys(models),
      datasets: datasets.map(d => ({ name: d.name, description: d.description })),
      tokenCounts,
      timestamp: new Date().toISOString(),
    },
  )

  // Generate markdown report
  const report = generateMarkdownReport(formatResults, results, questions, tokenCounts)
  await fsp.writeFile(
    path.join(resultsDir, 'report.md'),
    report,
  )

  return resultsDir
}
