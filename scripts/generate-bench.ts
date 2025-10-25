import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import * as url from 'node:url'
import { encode } from 'gpt-tokenizer' // o200k_base encoding (default)
import { encode as encodeToon } from '../src/index'

interface BenchmarkResult {
  name: string
  emoji: string
  jsonTokens: number
  toonTokens: number
  savings: number
  savingsPercent: string
}

const rootDir = url.fileURLToPath(new URL('../', import.meta.url))
const benchPath = path.join(rootDir, 'docs', 'benchmarks.md')

const BENCHMARK_EXAMPLES = [
  {
    name: 'Simple user object',
    emoji: '👤',
    data: {
      id: 123,
      name: 'Alice',
      email: 'alice@example.com',
      active: true,
    },
  },
  {
    name: 'User with tags',
    emoji: '🏷️',
    data: {
      user: {
        id: 123,
        name: 'Ada',
        tags: ['reading', 'gaming', 'coding'],
        active: true,
      },
    },
  },
  {
    name: 'Small product catalog',
    emoji: '📦',
    data: {
      items: [
        { sku: 'A1', name: 'Widget', qty: 2, price: 9.99 },
        { sku: 'B2', name: 'Gadget', qty: 1, price: 14.5 },
        { sku: 'C3', name: 'Doohickey', qty: 5, price: 7.25 },
      ],
    },
  },
  {
    name: 'API response with users',
    emoji: '👥',
    data: {
      users: [
        { id: 1, name: 'Alice', email: 'alice@example.com', active: true },
        { id: 2, name: 'Bob', email: 'bob@example.com', active: true },
        { id: 3, name: 'Charlie', email: 'charlie@example.com', active: false },
      ],
      total: 3,
      page: 1,
    },
  },
  {
    name: 'Nested configuration',
    emoji: '⚙️',
    data: {
      database: {
        host: 'localhost',
        port: 5432,
        credentials: {
          username: 'dbuser',
          password: 'secret123',
        },
      },
      cache: {
        enabled: true,
        ttl: 3600,
      },
    },
  },
  {
    name: 'E-commerce order',
    emoji: '🛒',
    data: {
      orderId: 'ORD-2025-001',
      customer: {
        id: 456,
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
      items: [
        { sku: 'PROD-A', name: 'Premium Widget', quantity: 2, price: 29.99 },
        { sku: 'PROD-B', name: 'Deluxe Gadget', quantity: 1, price: 49.99 },
      ],
      subtotal: 109.97,
      tax: 10.99,
      total: 120.96,
      status: 'pending',
    },
  },
  {
    name: 'Analytics data',
    emoji: '📊',
    data: {
      metrics: [
        { date: '2025-01-01', views: 1234, clicks: 89, conversions: 12 },
        { date: '2025-01-02', views: 2345, clicks: 156, conversions: 23 },
        { date: '2025-01-03', views: 1890, clicks: 123, conversions: 18 },
        { date: '2025-01-04', views: 3456, clicks: 234, conversions: 34 },
        { date: '2025-01-05', views: 2789, clicks: 178, conversions: 27 },
      ],
    },
  },
  {
    name: 'Large dataset (50 records)',
    emoji: '📈',
    data: {
      records: Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        score: (i * 7) % 100,
        active: i % 3 !== 0,
      })),
    },
  },
] as const

const DETAILED_EXAMPLE_INDICES = [2, 3, 6] // Small product catalog, API response, Analytics data

// Calculate total savings
let totalJsonTokens = 0
let totalToonTokens = 0

const results: BenchmarkResult[] = []

for (const example of BENCHMARK_EXAMPLES) {
  const jsonString = JSON.stringify(example.data, null, 2)
  const toonString = encodeToon(example.data)

  const jsonTokens = encode(jsonString).length
  const toonTokens = encode(toonString).length
  const savings = jsonTokens - toonTokens
  const savingsPercent = ((savings / jsonTokens) * 100).toFixed(1)

  totalJsonTokens += jsonTokens
  totalToonTokens += toonTokens

  results.push({
    name: example.name,
    emoji: example.emoji,
    jsonTokens,
    toonTokens,
    savings,
    savingsPercent,
  })
}

const totalSavings = totalJsonTokens - totalToonTokens
const totalSavingsPercent = ((totalSavings / totalJsonTokens) * 100).toFixed(1)

// Generate markdown content matching README style
const summaryRows = results
  .map(result => `| ${result.emoji} ${result.name} | ${result.jsonTokens} | ${result.toonTokens} | ${result.savings} | **${result.savingsPercent}%** |`)
  .join('\n')

const detailedExamples = DETAILED_EXAMPLE_INDICES
  .map((exampleIndex, i) => {
    const example = BENCHMARK_EXAMPLES[exampleIndex]!
    const result = results[exampleIndex]!
    const separator = i < DETAILED_EXAMPLE_INDICES.length - 1 ? '\n\n---' : ''

    return `### ${result.emoji} ${result.name}

**Savings: ${result.savings} tokens (${result.savingsPercent}% reduction)**

**JSON** (${result.jsonTokens} tokens):

\`\`\`json
${JSON.stringify(example.data, null, 2)}
\`\`\`

**TOON** (${result.toonTokens} tokens):

\`\`\`
${encodeToon(example.data)}
\`\`\`${separator}`
  })
  .join('\n\n')

const markdown = `
| Example | JSON | TOON | Tokens Saved | Reduction |
| ------- | ---- | ---- | ------------ | --------- |
${summaryRows}
| **Total** | **${totalJsonTokens}** | **${totalToonTokens}** | **${totalSavings}** | **${totalSavingsPercent}%** |

<details>
<summary><strong>View detailed results</strong></summary>

${detailedExamples}

</details>
`.trimStart()

console.log(markdown)

await fsp.mkdir(path.join(rootDir, 'docs'), { recursive: true })
await fsp.writeFile(benchPath, markdown, 'utf-8')

console.log(`✅ Benchmark written to ${benchPath}`)
