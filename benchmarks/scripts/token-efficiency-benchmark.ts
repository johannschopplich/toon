import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import * as prompts from '@clack/prompts'
import { encode } from '../../packages/toon/src'
import githubRepos from '../data/github-repos.json' with { type: 'json' }
import { BENCHMARKS_DIR, FORMATTER_DISPLAY_NAMES, ROOT_DIR } from '../src/constants'
import { generateAnalyticsData, generateOrderData } from '../src/datasets'
import { formatters } from '../src/formatters'
import { createProgressBar, ensureDir, tokenize } from '../src/utils'

interface FormatMetrics {
  name: string
  tokens: number
  savings: number
  savingsPercent: string
}

interface BenchmarkResult {
  name: string
  emoji: string
  description: string
  data: Record<string, any>
  formats: FormatMetrics[]
  showDetailed: boolean
}

const BENCHMARK_EXAMPLES = [
  {
    name: 'GitHub Repositories',
    emoji: '⭐',
    description: 'Top 100 GitHub repositories with stars, forks, and metadata',
    getData: () => ({ repositories: githubRepos }),
    showDetailed: true,
  },
  {
    name: 'Daily Analytics',
    emoji: '📈',
    description: '180 days of web metrics (views, clicks, conversions, revenue)',
    getData: () => generateAnalyticsData(180),
    showDetailed: true,
  },
  {
    name: 'E-Commerce Order',
    emoji: '🛒',
    description: 'Single nested order with customer and items',
    getData: generateOrderData,
    showDetailed: false,
  },
] as const

prompts.intro('Token Efficiency Benchmark')

const results: BenchmarkResult[] = []
const totalTokensByFormat: Record<string, number> = {}

for (const example of BENCHMARK_EXAMPLES) {
  const data = example.getData()

  // Calculate tokens for each format
  const formatMetrics: FormatMetrics[] = []
  const tokensByFormat: Record<string, number> = {}

  for (const [formatName, formatter] of Object.entries(formatters)) {
    const formattedString = formatter(data)
    const tokens = tokenize(formattedString)
    tokensByFormat[formatName] = tokens
    totalTokensByFormat[formatName] = (totalTokensByFormat[formatName] || 0) + tokens
  }

  // Calculate savings vs TOON
  const toonTokens = tokensByFormat.toon!
  for (const [formatName, tokens] of Object.entries(tokensByFormat)) {
    const savings = tokens - toonTokens
    formatMetrics.push({
      name: formatName,
      tokens,
      savings,
      savingsPercent: formatName === 'toon' ? '0.0' : ((savings / tokens) * 100).toFixed(1),
    })
  }

  results.push({
    name: example.name,
    emoji: example.emoji,
    description: example.description,
    data,
    formats: formatMetrics,
    showDetailed: example.showDetailed,
  })
}

// Calculate total savings percentages
const totalToonTokens = totalTokensByFormat.toon!
const totalSavingsPercent: Record<string, string> = {}
for (const [formatName, totalTokens] of Object.entries(totalTokensByFormat)) {
  if (formatName === 'toon') {
    totalSavingsPercent[formatName] = '0.0'
  }
  else {
    const savings = totalTokens - totalToonTokens
    totalSavingsPercent[formatName] = ((savings / totalTokens) * 100).toFixed(1)
  }
}

// Generate ASCII bar chart visualization (stacked compact format)
const formatOrder = ['json-pretty', 'json-compact', 'yaml', 'xml']
const datasetRows = results
  .map((result) => {
    const toon = result.formats.find(f => f.name === 'toon')!
    const percentage = Number.parseFloat(result.formats.find(f => f.name === 'json-pretty')!.savingsPercent)
    const bar = createProgressBar(100 - percentage, 100) // Invert to show TOON tokens
    const toonStr = toon.tokens.toLocaleString('en-US')

    const line1 = `${result.emoji} ${result.name.padEnd(25)} ${bar}   ${toonStr.padStart(6)} tokens`

    const comparisonLines = formatOrder.map((formatName) => {
      const format = result.formats.find(f => f.name === formatName)!
      const label = FORMATTER_DISPLAY_NAMES[formatName] || formatName.toUpperCase()
      const labelWithSavings = `vs ${label} (-${format.savingsPercent}%)`.padEnd(27)
      const tokenStr = format.tokens.toLocaleString('en-US').padStart(6)
      return `                             ${labelWithSavings}${tokenStr}`
    })

    return [line1, ...comparisonLines].join('\n')
  })
  .join('\n\n')

// Add separator and totals row
const separator = '─────────────────────────────────────────────────────────────────────'

// Calculate bar for totals (TOON vs average of comparison formats)
const comparisonTokens = formatOrder.map(name => totalTokensByFormat[name]!)
const averageComparisonTokens = comparisonTokens.reduce((a, b) => a + b, 0) / comparisonTokens.length
const totalPercentage = (totalToonTokens / averageComparisonTokens) * 100
const totalBar = createProgressBar(totalPercentage, 100)

const totalLine1 = `Total                        ${totalBar}   ${totalToonTokens.toLocaleString('en-US').padStart(6)} tokens`

const totalComparisonLines = formatOrder.map((formatName) => {
  const label = FORMATTER_DISPLAY_NAMES[formatName] || formatName.toUpperCase()
  const tokens = totalTokensByFormat[formatName]!
  const percent = totalSavingsPercent[formatName]!
  const labelWithSavings = `vs ${label} (-${percent}%)`.padEnd(27)
  const tokenStr = tokens.toLocaleString('en-US').padStart(6)
  return `                             ${labelWithSavings}${tokenStr}`
})

const barChartSection = `${datasetRows}\n\n${separator}\n${totalLine1}\n${totalComparisonLines.join('\n')}`

// Generate detailed examples (only for selected examples)
// Note: Large datasets are truncated for display readability in the report.
// Token counts are calculated from the full datasets, not the truncated versions.
const detailedExamples = results
  .filter(result => result.showDetailed)
  .map((result, i, filtered) => {
    // Truncate large datasets for display
    let displayData = result.data
    if (result.name === 'GitHub Repositories') {
      displayData = {
        repositories: result.data.repositories.slice(0, 3).map((repo: Record<string, any>) => ({
          ...repo,
          description: repo.description?.slice(0, 80) + (repo.description?.length > 80 ? '…' : ''),
        })),
      }
    }
    else if (result.name === 'Daily Analytics') {
      displayData = { metrics: result.data.metrics.slice(0, 5) }
    }

    const separator = i < filtered.length - 1 ? '\n\n---' : ''

    const json = result.formats.find(f => f.name === 'json-pretty')!
    const toon = result.formats.find(f => f.name === 'toon')!

    return `#### ${result.emoji} ${result.name}

**Configuration:** ${result.description}

**Savings:** ${json.savings.toLocaleString('en-US')} tokens (${json.savingsPercent}% reduction vs JSON)

**JSON** (${json.tokens.toLocaleString('en-US')} tokens):

\`\`\`json
${JSON.stringify(displayData, undefined, 2)}
\`\`\`

**TOON** (${toon.tokens.toLocaleString('en-US')} tokens):

\`\`\`
${encode(displayData)}
\`\`\`${separator}`
  })
  .join('\n\n')

const markdown = `### Token Efficiency

\`\`\`
${barChartSection}
\`\`\`

<details>
<summary><strong>View detailed examples</strong></summary>

${detailedExamples}

</details>
`.trimStart()

prompts.log.message(`${barChartSection}\n`)

const resultsDir = path.join(BENCHMARKS_DIR, 'results')
await ensureDir(resultsDir)

const outputFilePath = path.join(resultsDir, 'token-efficiency.md')
await fsp.writeFile(outputFilePath, markdown, 'utf-8')

prompts.log.success(`Result saved to \`${path.relative(ROOT_DIR, outputFilePath)}\``)
