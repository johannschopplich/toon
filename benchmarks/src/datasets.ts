/**
 * Datasets for TOON benchmarks
 *
 * These datasets are designed to test TOON's strengths and weaknesses:
 * - Tabular: Uniform records (TOON optimal)
 * - Nested: Complex structures with nested objects
 * - Analytics: Time-series data
 */

import type { Dataset } from './types'
import { faker } from '@faker-js/faker'
import githubRepos from '../data/github-repos.json' with { type: 'json' }

// Seed for reproducibility
faker.seed(12345)

/**
 * Employee record structure for tabular dataset
 */
export interface Employee {
  id: number
  name: string
  email: string
  department: string
  salary: number
  yearsExperience: number
  active: boolean
}

/**
 * E-commerce order structure for nested dataset
 */
export interface Order {
  orderId: string
  customer: {
    id: number
    name: string
    email: string
    phone: string
  }
  items: {
    sku: string
    name: string
    quantity: number
    price: number
  }[]
  subtotal: number
  tax: number
  total: number
  status: string
  orderDate?: string
  createdAt?: string
}

/**
 * Analytics metric structure for time-series dataset
 */
export interface AnalyticsMetric {
  date: string
  views: number
  clicks: number
  conversions: number
  revenue: number
  bounceRate: number
}

/**
 * GitHub repository structure for real-world dataset
 */
export interface Repository {
  id: number
  name: string
  owner: string
  repo: string
  description: string
  stars: number
  watchers: number
  forks: number
  defaultBranch: string
  createdAt: string
  updatedAt: string
  pushedAt: string
}

/**
 * Generate analytics time-series data
 */
export function generateAnalyticsData(days: number, startDate = '2025-01-01'): {
  metrics: AnalyticsMetric[]
} {
  const date = new Date(startDate)

  return {
    metrics: Array.from({ length: days }, (_, i) => {
      const currentDate = new Date(date)
      currentDate.setDate(currentDate.getDate() + i)

      // Simulate realistic web traffic with some variation
      const baseViews = 5000
      const weekendMultiplier = currentDate.getDay() === 0 || currentDate.getDay() === 6 ? 0.7 : 1.0
      const views = Math.round(baseViews * weekendMultiplier + faker.number.int({ min: -1000, max: 3000 }))
      const clicks = Math.round(views * faker.number.float({ min: 0.02, max: 0.08 }))
      const conversions = Math.round(clicks * faker.number.float({ min: 0.05, max: 0.15 }))
      const avgOrderValue = faker.number.float({ min: 49.99, max: 299.99 })
      const revenue = Number((conversions * avgOrderValue).toFixed(2))

      return {
        date: currentDate.toISOString().split('T')[0]!,
        views,
        clicks,
        conversions,
        revenue,
        bounceRate: faker.number.float({ min: 0.3, max: 0.7, fractionDigits: 2 }),
      }
    }),
  }
}

/**
 * Tabular dataset: 100 uniform employee records
 *
 * @remarks
 * Tests TOON's tabular array format
 */
const departments: readonly string[] = ['Engineering', 'Sales', 'Marketing', 'HR', 'Operations', 'Finance'] as const
const tabularDataset: Dataset = {
  name: 'tabular',
  description: 'Uniform employee records (TOON optimal format)',
  data: {
    employees: Array.from({ length: 100 }, (_, i): Employee => {
      const yearsExp = faker.number.int({ min: 1, max: 20 })
      return {
        id: i + 1,
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        department: departments[i % departments.length]!,
        salary: faker.number.int({ min: 45000, max: 150000 }),
        yearsExperience: yearsExp,
        active: faker.datatype.boolean(0.8), // 80% active
      }
    }),
  },
}

/**
 * Nested dataset: 50 e-commerce orders with nested structures
 *
 * @remarks
 * Tests TOON's handling of complex nested objects
 */
const productNames: readonly string[] = ['Wireless Mouse', 'USB Cable', 'Laptop Stand', 'Keyboard', 'Webcam', 'Headphones', 'Monitor', 'Desk Lamp'] as const
const statuses: readonly string[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const

const nestedDataset: Dataset = {
  name: 'nested',
  description: 'E-commerce orders with nested structures',
  data: {
    orders: Array.from({ length: 50 }, (_, i) => {
      const customerId = (i % 20) + 1
      const itemCount = faker.number.int({ min: 1, max: 4 })

      const items = Array.from({ length: itemCount }, (_, j) => {
        const price = faker.number.float({ min: 9.99, max: 199.99, fractionDigits: 2 })
        const quantity = faker.number.int({ min: 1, max: 5 })
        return {
          sku: `SKU-${faker.string.alphanumeric({ length: 6 }).toUpperCase()}`,
          name: productNames[j % productNames.length]!,
          quantity,
          price,
        }
      })

      const total = Number(items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2))

      return {
        orderId: `ORD-${String(i + 1).padStart(4, '0')}`,
        customer: {
          id: customerId,
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
        },
        items,
        total,
        status: statuses[i % statuses.length]!,
        orderDate: faker.date.recent({ days: 90 }).toISOString().split('T')[0],
      }
    }),
  },
}

/**
 * Analytics dataset: 60 days of time-series metrics
 *
 * @remarks
 * Tests TOON's handling of numeric data and date fields
 */
const analyticsDataset: Dataset = {
  name: 'analytics',
  description: 'Time-series analytics data',
  data: generateAnalyticsData(60),
}

/**
 * Real-world dataset: Top 100 starred GitHub repositories
 *
 * @remarks
 * Tests TOON's tabular format
 */
const githubDataset: Dataset = {
  name: 'github',
  description: 'Top 100 GitHub repositories',
  data: {
    repositories: githubRepos,
  },
}

/**
 * Generate a single e-commerce order with nested structure
 *
 * @remarks
 * Used for token efficiency benchmarks
 */
export function generateOrderData(): Order {
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

/**
 * All datasets used in the benchmark
 */
export const datasets: Dataset[] = [
  tabularDataset,
  nestedDataset,
  analyticsDataset,
  githubDataset,
]
