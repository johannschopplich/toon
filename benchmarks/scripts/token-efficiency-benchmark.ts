import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import * as prompts from '@clack/prompts'
import { encode } from '../../src/index'
import githubRepos from '../data/github-repos.json' with { type: 'json' }
import { BENCHMARKS_DIR, ROOT_DIR } from '../src/constants'
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

// Calculate total savings
let totalJsonTokens = 0
let totalToonTokens = 0
let totalXmlTokens = 0

const results: BenchmarkResult[] = []

for (const example of BENCHMARK_EXAMPLES) {
  const data = example.getData()

  const jsonString = JSON.stringify(data, undefined, 2)
  const toonString = encode(data)
  const xmlString = formatters.xml!(data)

  const jsonTokens = tokenize(jsonString)
  const toonTokens = tokenize(toonString)
  const xmlTokens = tokenize(xmlString)

  const jsonSavings = jsonTokens - toonTokens
  const xmlSavings = xmlTokens - toonTokens

  totalJsonTokens += jsonTokens
  totalToonTokens += toonTokens
  totalXmlTokens += xmlTokens

  results.push({
    name: example.name,
    emoji: example.emoji,
    description: example.description,
    data,
    formats: [
      {
        name: 'toon',
        tokens: toonTokens,
        savings: 0,
        savingsPercent: '0.0',
      },
      {
        name: 'json',
        tokens: jsonTokens,
        savings: jsonSavings,
        savingsPercent: ((jsonSavings / jsonTokens) * 100).toFixed(1),
      },
      {
        name: 'xml',
        tokens: xmlTokens,
        savings: xmlSavings,
        savingsPercent: ((xmlSavings / xmlTokens) * 100).toFixed(1),
      },
    ],
    showDetailed: example.showDetailed,
  })
}

const totalJsonSavings = totalJsonTokens - totalToonTokens
const totalJsonSavingsPercent = ((totalJsonSavings / totalJsonTokens) * 100).toFixed(1)

const totalXmlSavings = totalXmlTokens - totalToonTokens
const totalXmlSavingsPercent = ((totalXmlSavings / totalXmlTokens) * 100).toFixed(1)

// Generate ASCII bar chart visualization (stacked compact format)
const datasetRows = results
  .map((result) => {
    const toon = result.formats.find(f => f.name === 'toon')!
    const json = result.formats.find(f => f.name === 'json')!
    const xml = result.formats.find(f => f.name === 'xml')!

    const percentage = Number.parseFloat(json.savingsPercent)
    const bar = createProgressBar(100 - percentage, 100) // Invert to show TOON tokens
    const toonStr = toon.tokens.toLocaleString('en-US')
    const jsonStr = json.tokens.toLocaleString('en-US')
    const xmlStr = xml.tokens.toLocaleString('en-US')

    const line1 = `${result.emoji} ${result.name.padEnd(25)} ${bar}  ${toonStr.padStart(6)} tokens`
    const line2 = `                             vs JSON: ${jsonStr.padStart(6)}  💰 ${json.savingsPercent}% saved`
    const line3 = `                             vs XML:  ${xmlStr.padStart(6)}  💰 ${xml.savingsPercent}% saved`

    return `${line1}\n${line2}\n${line3}`
  })
  .join('\n\n')

// Add separator and totals row
const separator = '─────────────────────────────────────────────────────────────────────'

// Calculate bar for totals (TOON vs average of JSON+XML)
const averageComparisonTokens = (totalJsonTokens + totalXmlTokens) / 2
const totalPercentage = (totalToonTokens / averageComparisonTokens) * 100
const totalBar = createProgressBar(totalPercentage, 100)

const totalLine1 = `Total                        ${totalBar}  ${totalToonTokens.toLocaleString('en-US').padStart(6)} tokens`
const totalLine2 = `                             vs JSON: ${totalJsonTokens.toLocaleString('en-US').padStart(6)}  💰 ${totalJsonSavingsPercent}% saved`
const totalLine3 = `                             vs XML:  ${totalXmlTokens.toLocaleString('en-US').padStart(6)}  💰 ${totalXmlSavingsPercent}% saved`

const barChartSection = `${datasetRows}\n\n${separator}\n${totalLine1}\n${totalLine2}\n${totalLine3}`

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

    const json = result.formats.find(f => f.name === 'json')!
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
