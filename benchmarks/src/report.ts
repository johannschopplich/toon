import type { EvaluationResult, FormatResult, Question } from './types'
import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import { BENCHMARKS_DIR, FORMATTER_DISPLAY_NAMES } from './constants'
import { datasets } from './datasets'
import { models } from './evaluate'
import { createProgressBar, ensureDir, tokenize } from './utils'

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
  const json = formatResults.find(r => r.format === 'json-pretty')

  const modelIds = models.map(m => m.modelId)
  const modelNames = modelIds.filter(id => results.some(r => r.model === id))

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
      const accuracyString = `${(result.accuracy * 100).toFixed(1)}%`.padStart(6)
      const countString = `(${result.correctCount}/${result.totalCount})`
      const prefix = result.format === 'toon' ? '→ ' : '  '
      const displayName = FORMATTER_DISPLAY_NAMES[result.format] || result.format
      return `${prefix}${displayName.padEnd(12)}   ${bar}   ${accuracyString} ${countString}`
    }).join('\n')

    // Add blank line before model name, except for first model
    return `${i > 0 ? '\n' : ''}${modelName}\n${formatLines}`
  }).join('\n')

  // Build summary comparison
  const summaryComparison = toon && json
    ? `**Key tradeoff:** TOON achieves **${(toon.accuracy * 100).toFixed(1)}% accuracy** (vs JSON's ${(json.accuracy * 100).toFixed(1)}%) while using **${((1 - toon.totalTokens / json.totalTokens) * 100).toFixed(1)}% fewer tokens** on these datasets.`
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
      `| \`${result.format}\` | ${(result.accuracy * 100).toFixed(1)}% | ${result.tokens.toLocaleString('en-US')} | ${result.correctCount}/${result.totalCount} |`,
    ).join('\n')

    return `
##### ${dataset.description}

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
${tableRows}
`.trimStart()
  }).filter(Boolean).join('\n').trim()

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
  }).join('\n').trim()

  // Calculate total unique questions
  const totalQuestions = [...new Set(results.map(r => r.questionId))].length

  // Calculate question type distribution
  const fieldRetrievalCount = questions.filter(q => q.type === 'field-retrieval').length
  const aggregationCount = questions.filter(q => q.type === 'aggregation').length
  const filteringCount = questions.filter(q => q.type === 'filtering').length

  const fieldRetrievalPercent = ((fieldRetrievalCount / totalQuestions) * 100).toFixed(0)
  const aggregationPercent = ((aggregationCount / totalQuestions) * 100).toFixed(0)
  const filteringPercent = ((filteringCount / totalQuestions) * 100).toFixed(0)

  // Calculate dataset sizes
  const tabularSize = datasets.find(d => d.name === 'tabular')?.data.employees?.length || 0
  const nestedSize = datasets.find(d => d.name === 'nested')?.data.orders?.length || 0
  const analyticsSize = datasets.find(d => d.name === 'analytics')?.data.metrics?.length || 0
  const githubSize = datasets.find(d => d.name === 'github')?.data.repositories?.length || 0

  // Calculate number of formats and evaluations
  const formatCount = formatResults.length
  const totalEvaluations = totalQuestions * formatCount * modelNames.length

  return `
### Retrieval Accuracy

Accuracy across **${modelNames.length} ${modelNames.length === 1 ? 'LLM' : 'LLMs'}** on ${totalQuestions} data retrieval questions:

\`\`\`
${modelBreakdown}
\`\`\`

${summaryComparison}

<details>
<summary><strong>Performance by dataset and model</strong></summary>

#### Performance by Dataset

${datasetBreakdown}

#### Performance by Model

${modelPerformance}

</details>

<details>
<summary><strong>How the benchmark works</strong></summary>

#### What's Being Measured

This benchmark tests **LLM comprehension and data retrieval accuracy** across different input formats. Each LLM receives formatted data and must answer questions about it (this does **not** test model's ability to generate TOON output).

#### Datasets Tested

Four datasets designed to test different structural patterns (all contain arrays of uniform objects, TOON's optimal format):

1. **Tabular** (${tabularSize} employee records): Uniform objects with identical fields – optimal for TOON's tabular format.
2. **Nested** (${nestedSize} e-commerce orders): Complex structures with nested customer objects and item arrays.
3. **Analytics** (${analyticsSize} days of metrics): Time-series data with dates and numeric values.
4. **GitHub** (${githubSize} repositories): Real-world data from top GitHub repos by stars.

#### Question Types

${totalQuestions} questions are generated dynamically across three categories:

\- **Field retrieval (${fieldRetrievalPercent}%)**: Direct value lookups or values that can be read straight off a record (including booleans and simple counts such as array lengths)
  - Example: "What is Alice's salary?" → \`75000\`
  - Example: "How many items are in order ORD-0042?" → \`3\`
  - Example: "What is the customer name for order ORD-0042?" → \`John Doe\`

- **Aggregation (${aggregationPercent}%)**: Dataset-level totals and averages plus single-condition filters (counts, sums, min/max comparisons)
  - Example: "How many employees work in Engineering?" → \`17\`
  - Example: "What is the total revenue across all orders?" → \`45123.50\`
  - Example: "How many employees have salary > 80000?" → \`23\`

- **Filtering (${filteringPercent}%)**: Multi-condition queries requiring compound logic (AND constraints across fields)
  - Example: "How many employees in Sales have salary > 80000?" → \`5\`
  - Example: "How many active employees have more than 10 years of experience?" → \`8\`

#### Evaluation Process

1. **Format conversion**: Each dataset is converted to all ${formatCount} formats (${formatResults.map(f => FORMATTER_DISPLAY_NAMES[f.format] || f.format).join(', ')}).
2. **Query LLM**: Each model receives formatted data + question in a prompt and extracts the answer.
3. **Validate with LLM-as-judge**: \`gpt-5-nano\` validates if the answer is semantically correct (e.g., \`50000\` = \`$50,000\`, \`Engineering\` = \`engineering\`, \`2025-01-01\` = \`January 1, 2025\`).

#### Models & Configuration

- **Models tested**: ${modelNames.map(m => `\`${m}\``).join(', ')}
- **Token counting**: Using \`gpt-tokenizer\` with \`o200k_base\` encoding (GPT-5 tokenizer)
- **Temperature**: Not set (models use their defaults)
- **Total evaluations**: ${totalQuestions} questions × ${formatCount} formats × ${modelNames.length} models = ${totalEvaluations.toLocaleString('en-US')} LLM calls

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
 *
 * @remarks
 * Per-model results are managed separately via storage.ts
 * This function only generates the aggregated markdown report
 */
export async function saveResults(
  results: EvaluationResult[],
  formatResults: FormatResult[],
  questions: Question[],
  tokenCounts: Record<string, number>,
): Promise<string> {
  const resultsDir = path.join(BENCHMARKS_DIR, 'results')
  await ensureDir(resultsDir)

  // Generate markdown report from all available model results
  const report = generateMarkdownReport(formatResults, results, questions, tokenCounts)
  await fsp.writeFile(path.join(resultsDir, 'retrieval-accuracy.md'), report)

  return resultsDir
}
