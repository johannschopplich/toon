/**
 * Question generation for TOON benchmarks
 *
 * Generates ~160 questions across different types:
 * - Field retrieval (50%): "What is X's Y?"
 * - Aggregation (25%): "How many X have Y?"
 * - Filtering (25%): "List/count X where Y"
 *
 * Questions are generated dynamically based on actual data values
 *
 * TODO: Balance question distribution across datasets to ensure fair representation.
 * Current distribution:
 * - Tabular: 70 questions (43%)
 * - Nested: 50 questions (31%)
 * - Analytics: 40 questions (25%)
 * - GitHub: 40 questions (25%)
 */

import type { AnalyticsMetric, Employee, Order, Repository } from './datasets'
import type { Question } from './types'
import { consola } from 'consola'
import { datasets } from './datasets'

/**
 * Generate all questions from datasets
 */
export function generateQuestions(): Question[] {
  const questions: Question[] = []
  let idCounter = 1

  // Get datasets with proper typing
  const tabular = (datasets.find(d => d.name === 'tabular')?.data.employees as Employee[]) ?? []
  const nested = (datasets.find(d => d.name === 'nested')?.data.orders as Order[]) ?? []
  const analytics = (datasets.find(d => d.name === 'analytics')?.data.metrics as AnalyticsMetric[]) ?? []
  const github = (datasets.find(d => d.name === 'github')?.data.repositories as Repository[]) ?? []

  // ========================================
  // TABULAR DATASET QUESTIONS (70 questions)
  // ========================================

  if (tabular.length > 0) {
    // Field retrieval: specific employees (40 questions)
    for (let i = 0; i < Math.min(40, tabular.length); i++) {
      const emp = tabular[i * 2] || tabular[i]
      if (!emp)
        continue

      // Alternate between different field types
      if (i % 3 === 0) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `What is the salary of ${emp.name}?`,
          groundTruth: String(emp.salary),
          type: 'field-retrieval',
          dataset: 'tabular',
        })
      }
      else if (i % 3 === 1) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `What department does ${emp.name} work in?`,
          groundTruth: emp.department,
          type: 'field-retrieval',
          dataset: 'tabular',
        })
      }
      else {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `What is the email address of ${emp.name}?`,
          groundTruth: emp.email,
          type: 'field-retrieval',
          dataset: 'tabular',
        })
      }
    }

    // Aggregation: count by department
    const departments = [...new Set(tabular.map(e => e.department))]
    for (const dept of departments.slice(0, 6)) {
      const count = tabular.filter(e => e.department === dept).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many employees work in ${dept}?`,
        groundTruth: String(count),
        type: 'aggregation',
        dataset: 'tabular',
      })
    }

    // Aggregation: salary ranges (4 questions)
    const salaryThresholds = [60000, 80000, 100000, 120000]
    for (const threshold of salaryThresholds) {
      const count = tabular.filter(e => e.salary > threshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many employees have a salary greater than ${threshold}?`,
        groundTruth: String(count),
        type: 'aggregation',
        dataset: 'tabular',
      })
    }

    // Filtering: active status
    const activeCount = tabular.filter(e => e.active).length
    const inactiveCount = tabular.filter(e => !e.active).length
    questions.push(
      {
        id: `q${idCounter++}`,
        prompt: 'How many employees are active?',
        groundTruth: String(activeCount),
        type: 'filtering',
        dataset: 'tabular',
      },
      {
        id: `q${idCounter++}`,
        prompt: 'How many employees are inactive?',
        groundTruth: String(inactiveCount),
        type: 'filtering',
        dataset: 'tabular',
      },
    )

    // Complex filtering: multi-condition (8 questions)
    for (const dept of departments.slice(0, 4)) {
      const count = tabular.filter(e => e.department === dept && e.salary > 80000).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many employees in ${dept} have a salary greater than 80000?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'tabular',
      })
    }

    for (const exp of [5, 10]) {
      const count = tabular.filter(e => e.yearsExperience > exp && e.active).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many active employees have more than ${exp} years of experience?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'tabular',
      })
    }
  }

  // ========================================
  // NESTED DATASET QUESTIONS (50 questions)
  // ========================================

  if (nested.length > 0) {
    // Field retrieval: order totals (20 questions)
    for (let i = 0; i < Math.min(20, nested.length); i++) {
      const order = nested[i * 2] || nested[i]
      if (!order)
        continue

      if (i % 2 === 0) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `What is the total amount for order ${order.orderId}?`,
          groundTruth: String(order.total),
          type: 'field-retrieval',
          dataset: 'nested',
        })
      }
      else {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `What is the status of order ${order.orderId}?`,
          groundTruth: order.status,
          type: 'field-retrieval',
          dataset: 'nested',
        })
      }
    }

    // Field retrieval: customer info (15 questions)
    for (let i = 0; i < Math.min(15, nested.length); i++) {
      const order = nested[i * 3] || nested[i]
      if (!order)
        continue

      questions.push({
        id: `q${idCounter++}`,
        prompt: `What is the customer name for order ${order.orderId}?`,
        groundTruth: order.customer.name,
        type: 'field-retrieval',
        dataset: 'nested',
      })
    }

    // Aggregation: count by status
    const statuses = [...new Set(nested.map(o => o.status))]
    for (const status of statuses) {
      const count = nested.filter(o => o.status === status).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many orders have status "${status}"?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'nested',
      })
    }

    // Aggregation: total revenue
    const totalRevenue = nested.reduce((sum, o) => sum + o.total, 0)
    questions.push({
      id: `q${idCounter++}`,
      prompt: 'What is the total revenue across all orders?',
      groundTruth: String(totalRevenue.toFixed(2)),
      type: 'aggregation',
      dataset: 'nested',
    })

    // Filtering: high-value orders (3 questions)
    const highValueThresholds = [200, 400, 600]
    for (const threshold of highValueThresholds) {
      const count = nested.filter(o => o.total > threshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many orders have a total greater than ${threshold}?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'nested',
      })
    }
  }

  // ========================================
  // ANALYTICS DATASET QUESTIONS (40 questions)
  // ========================================

  if (analytics.length > 0) {
    // Field retrieval: specific dates (20 questions)
    for (let i = 0; i < Math.min(20, analytics.length); i++) {
      const metric = analytics[i * 3] || analytics[i]
      if (!metric)
        continue

      if (i % 2 === 0) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `How many views were recorded on ${metric.date}?`,
          groundTruth: String(metric.views),
          type: 'field-retrieval',
          dataset: 'analytics',
        })
      }
      else {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `What was the revenue on ${metric.date}?`,
          groundTruth: String(metric.revenue),
          type: 'field-retrieval',
          dataset: 'analytics',
        })
      }
    }

    // Aggregation: totals (4 questions)
    const totalViews = analytics.reduce((sum, m) => sum + m.views, 0)
    const totalRevenue = analytics.reduce((sum, m) => sum + m.revenue, 0)
    const totalConversions = analytics.reduce((sum, m) => sum + m.conversions, 0)

    questions.push(
      {
        id: `q${idCounter++}`,
        prompt: 'What is the total number of views across all dates?',
        groundTruth: String(totalViews),
        type: 'aggregation',
        dataset: 'analytics',
      },
      {
        id: `q${idCounter++}`,
        prompt: 'What is the total revenue across all dates?',
        groundTruth: String(totalRevenue.toFixed(2)),
        type: 'aggregation',
        dataset: 'analytics',
      },
      {
        id: `q${idCounter++}`,
        prompt: 'What is the total number of conversions across all dates?',
        groundTruth: String(totalConversions),
        type: 'aggregation',
        dataset: 'analytics',
      },
    )

    // Filtering: high-performing days (10 questions)
    const viewThresholds = [5000, 6000, 7000]
    for (const threshold of viewThresholds) {
      const count = analytics.filter(m => m.views > threshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many days had more than ${threshold} views?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'analytics',
      })
    }

    const conversionThresholds = [10, 20, 30]
    for (const threshold of conversionThresholds) {
      const count = analytics.filter(m => m.conversions > threshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many days had more than ${threshold} conversions?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'analytics',
      })
    }
  }

  // ========================================
  // GITHUB DATASET QUESTIONS (40 questions)
  // ========================================

  if (github.length > 0) {
    // Field retrieval: specific repos (20 questions)
    for (let i = 0; i < Math.min(20, github.length); i++) {
      const repo = github[i * 10] || github[i]
      if (!repo)
        continue

      if (i % 2 === 0) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `How many stars does ${repo.owner}/${repo.name} have?`,
          groundTruth: String(repo.stars),
          type: 'field-retrieval',
          dataset: 'github',
        })
      }
      else {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `How many forks does ${repo.owner}/${repo.name} have?`,
          groundTruth: String(repo.forks),
          type: 'field-retrieval',
          dataset: 'github',
        })
      }
    }

    // Aggregation: count by owner (5 questions)
    const owners = [...new Set(github.map(r => r.owner))]
    for (const owner of owners.slice(0, 5)) {
      const count = github.filter(r => r.owner === owner).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many repositories does ${owner} have in the dataset?`,
        groundTruth: String(count),
        type: 'aggregation',
        dataset: 'github',
      })
    }

    // Aggregation: total stars
    const totalStars = github.reduce((sum, r) => sum + r.stars, 0)
    questions.push({
      id: `q${idCounter++}`,
      prompt: 'What is the total number of stars across all repositories?',
      groundTruth: String(totalStars),
      type: 'aggregation',
      dataset: 'github',
    })

    // Filtering: popular repos (8 questions)
    const starThresholds = [10000, 50000, 100000]
    for (const threshold of starThresholds) {
      const count = github.filter(r => r.stars > threshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many repositories have more than ${threshold} stars?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'github',
      })
    }

    const forkThresholds = [1000, 5000, 10000]
    for (const threshold of forkThresholds) {
      const count = github.filter(r => r.forks > threshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many repositories have more than ${threshold} forks?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'github',
      })
    }
  }

  consola.info(`Question breakdown:`)
  consola.box(`
Tabular: ${questions.filter(q => q.dataset === 'tabular').length}
Nested: ${questions.filter(q => q.dataset === 'nested').length}
Analytics: ${questions.filter(q => q.dataset === 'analytics').length}
GitHub: ${questions.filter(q => q.dataset === 'github').length}
Total: ${questions.length}
`.trim())

  return questions
}
