import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import { faker } from '@faker-js/faker'
import { consola } from 'consola'
import { encode as encodeTokens } from 'gpt-tokenizer' // o200k_base encoding (default)
import { encode } from '../../src/index'
import githubRepos from '../data/github-repos.json' with { type: 'json' }
import { BENCHMARKS_DIR, ROOT_DIR } from '../src/constants'

interface BenchmarkResult {
  name: string
  emoji: string
  description: string
  data: any
  jsonTokens: number
  toonTokens: number
  savings: number
  savingsPercent: string
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
    getData: () => generateAnalytics(180),
    showDetailed: true,
  },
  {
    name: 'API Response',
    emoji: '👥',
    description: '50 user records with metadata and timestamps',
    getData: () => generateUsers(50),
    showDetailed: false,
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

const results: BenchmarkResult[] = []

for (const example of BENCHMARK_EXAMPLES) {
  const data = example.getData()

  const jsonString = JSON.stringify(data, undefined, 2)
  const toonString = encode(data)

  const jsonTokens = encodeTokens(jsonString).length
  const toonTokens = encodeTokens(toonString).length
  const savings = jsonTokens - toonTokens
  const savingsPercent = ((savings / jsonTokens) * 100).toFixed(1)

  totalJsonTokens += jsonTokens
  totalToonTokens += toonTokens

  results.push({
    name: example.name,
    emoji: example.emoji,
    description: example.description,
    data,
    jsonTokens,
    toonTokens,
    savings,
    savingsPercent,
    showDetailed: example.showDetailed,
  })
}

const totalSavings = totalJsonTokens - totalToonTokens
const totalSavingsPercent = ((totalSavings / totalJsonTokens) * 100).toFixed(1)

// Generate ASCII bar chart visualization
const barChartSection = results
  .map((result) => {
    const percentage = Number.parseFloat(result.savingsPercent)
    const bar = generateBarChart(100 - percentage) // Invert to show TOON tokens
    const jsonStr = result.jsonTokens.toLocaleString('en-US')
    const toonStr = result.toonTokens.toLocaleString('en-US')
    return `${result.emoji} ${result.name.padEnd(25)} ${bar}  ${toonStr.padStart(6)} tokens  (JSON: ${jsonStr.padStart(6)})  💰 ${result.savingsPercent}% saved`
  })
  .join('\n')

// Generate detailed examples (only for selected examples)
const detailedExamples = results
  .filter(result => result.showDetailed)
  .map((result, i, filtered) => {
    // Truncate large datasets for display
    let displayData = result.data
    if (result.name === 'GitHub Repositories') {
      displayData = {
        repositories: result.data.repositories.slice(0, 3).map((repo: any) => ({
          ...repo,
          description: repo.description?.slice(0, 80) + (repo.description?.length > 80 ? '...' : ''),
        })),
      }
    }
    else if (result.name === 'Daily Analytics') {
      displayData = { metrics: result.data.metrics.slice(0, 5) }
    }

    const separator = i < filtered.length - 1 ? '\n\n---' : ''

    return `#### ${result.emoji} ${result.name}

**Configuration:** ${result.description}

**Savings:** ${result.savings.toLocaleString('en-US')} tokens (${result.savingsPercent}% reduction)

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

**Total:** ${totalToonTokens.toLocaleString('en-US')} tokens (TOON) vs ${totalJsonTokens.toLocaleString('en-US')} tokens (JSON) → ${totalSavingsPercent}% savings

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

// Generate analytics time series data
function generateAnalytics(days: number) {
  return {
    metrics: Array.from({ length: days }, (_, i) => {
      const date = new Date(2025, 0, 1)
      date.setDate(date.getDate() + i)
      return {
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 5000) + 1000,
        clicks: Math.floor(Math.random() * 500) + 50,
        conversions: Math.floor(Math.random() * 100) + 10,
        revenue: Number((Math.random() * 1000 + 100).toFixed(2)),
      }
    }),
  }
}

// Generate user API response
function generateUsers(count: number) {
  return {
    users: Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: faker.helpers.arrayElement(['admin', 'user', 'moderator']),
      active: faker.datatype.boolean(),
      createdAt: faker.date.past({ years: 2 }).toISOString(),
      lastLogin: faker.date.recent({ days: 30 }).toISOString(),
    })),
    total: count,
    page: 1,
  }
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
