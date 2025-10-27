import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import { faker } from '@faker-js/faker'
import { consola } from 'consola'
import { encode as encodeTokens } from 'gpt-tokenizer' // o200k_base encoding (default)
import { encode } from '../../src/index'
import githubRepos from '../data/github-repos.json' with { type: 'json' }
import { BENCHMARKS_DIR, ROOT_DIR } from '../src/constants'
import { generateAnalyticsData } from '../src/datasets'
import { formatters } from '../src/formatters'

interface BenchmarkResult {
  name: string
  emoji: string
  description: string
  data: Record<string, any>
  jsonTokens: number
  toonTokens: number
  xmlTokens: number
  jsonSavings: number
  jsonSavingsPercent: string
  xmlSavings: number
  xmlSavingsPercent: string
  showDetailed: boolean
}

const outputFilePath = path.join(BENCHMARKS_DIR, 'results', 'token-efficiency.md')

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
    getData: generateOrder,
    showDetailed: false,
  },
] as const

// Calculate total savings
let totalJsonTokens = 0
let totalToonTokens = 0
let totalXmlTokens = 0

const results: BenchmarkResult[] = []

for (const example of BENCHMARK_EXAMPLES) {
  const data = example.getData()

  const jsonString = JSON.stringify(data, undefined, 2)
  const toonString = encode(data)
  const xmlString = formatters.xml(data)

  const jsonTokens = encodeTokens(jsonString).length
  const toonTokens = encodeTokens(toonString).length
  const xmlTokens = encodeTokens(xmlString).length

  const jsonSavings = jsonTokens - toonTokens
  const jsonSavingsPercent = ((jsonSavings / jsonTokens) * 100).toFixed(1)

  const xmlSavings = xmlTokens - toonTokens
  const xmlSavingsPercent = ((xmlSavings / xmlTokens) * 100).toFixed(1)

  totalJsonTokens += jsonTokens
  totalToonTokens += toonTokens
  totalXmlTokens += xmlTokens

  results.push({
    name: example.name,
    emoji: example.emoji,
    description: example.description,
    data,
    jsonTokens,
    toonTokens,
    xmlTokens,
    jsonSavings,
    jsonSavingsPercent,
    xmlSavings,
    xmlSavingsPercent,
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
    const percentage = Number.parseFloat(result.jsonSavingsPercent)
    const bar = generateBarChart(100 - percentage) // Invert to show TOON tokens
    const toonStr = result.toonTokens.toLocaleString('en-US')
    const jsonStr = result.jsonTokens.toLocaleString('en-US')
    const xmlStr = result.xmlTokens.toLocaleString('en-US')

    const line1 = `${result.emoji} ${result.name.padEnd(25)} ${bar}  ${toonStr.padStart(6)} tokens`
    const line2 = `                             vs JSON: ${jsonStr.padStart(6)}  💰 ${result.jsonSavingsPercent}% saved`
    const line3 = `                             vs XML:  ${xmlStr.padStart(6)}  💰 ${result.xmlSavingsPercent}% saved`

    return `${line1}\n${line2}\n${line3}`
  })
  .join('\n\n')

// Add separator and totals row
const separator = '─────────────────────────────────────────────────────────────────────'

// Calculate bar for totals (TOON vs average of JSON+XML)
const averageComparisonTokens = (totalJsonTokens + totalXmlTokens) / 2
const totalPercentage = (totalToonTokens / averageComparisonTokens) * 100
const totalBar = generateBarChart(totalPercentage)

const totalLine1 = `Total                        ${totalBar}  ${totalToonTokens.toLocaleString('en-US').padStart(6)} tokens`
const totalLine2 = `                             vs JSON: ${totalJsonTokens.toLocaleString('en-US').padStart(6)}  💰 ${totalJsonSavingsPercent}% saved`
const totalLine3 = `                             vs XML:  ${totalXmlTokens.toLocaleString('en-US').padStart(6)}  💰 ${totalXmlSavingsPercent}% saved`

const barChartSection = `${datasetRows}\n\n${separator}\n${totalLine1}\n${totalLine2}\n${totalLine3}`

// Generate detailed examples (only for selected examples)
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

    return `#### ${result.emoji} ${result.name}

**Configuration:** ${result.description}

**Savings:** ${result.jsonSavings.toLocaleString('en-US')} tokens (${result.jsonSavingsPercent}% reduction vs JSON)

**JSON** (${result.jsonTokens.toLocaleString('en-US')} tokens):

\`\`\`json
${JSON.stringify(displayData, undefined, 2)}
\`\`\`

**TOON** (${result.toonTokens.toLocaleString('en-US')} tokens):

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

console.log(markdown)

await fsp.mkdir(path.join(BENCHMARKS_DIR, 'results'), { recursive: true })
await fsp.writeFile(outputFilePath, markdown, 'utf-8')

consola.success(`Benchmark written to \`${path.relative(ROOT_DIR, outputFilePath)}\``)

// Generate ASCII bar chart
function generateBarChart(percentage: number, maxWidth: number = 25): string {
  const filled = Math.round((percentage / 100) * maxWidth)
  const empty = maxWidth - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

// Generate nested e-commerce order
function generateOrder() {
  return {
    orderId: faker.string.alphanumeric({ length: 12, casing: 'upper' }),
    customer: {
      id: faker.number.int({ min: 1000, max: 9999 }),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
    },
    items: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
      sku: faker.string.alphanumeric({ length: 8, casing: 'upper' }),
      name: faker.commerce.productName(),
      quantity: faker.number.int({ min: 1, max: 5 }),
      price: Number(faker.commerce.price({ min: 10, max: 200 })),
    })),
    subtotal: Number(faker.commerce.price({ min: 100, max: 500 })),
    tax: Number(faker.commerce.price({ min: 10, max: 50 })),
    total: Number(faker.commerce.price({ min: 110, max: 550 })),
    status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered']),
    createdAt: faker.date.recent({ days: 7 }).toISOString(),
  }
}
