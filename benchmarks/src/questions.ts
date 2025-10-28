/**
 * Question generation for TOON benchmarks
 *
 * Generates ~150-160 questions across different question types and datasets:
 * - Field Retrieval: Direct field access with no computation
 *   Examples: "What is X's salary?", "What is the status of order Y?"
 * - Aggregation: Counts, sums, averages, min/max operations (including single-condition filters)
 *   Examples: "How many X?", "What is the total/average?", "How many X > threshold?"
 * - Filtering: Multi-condition queries requiring complex logical operations
 *   Examples: "How many X WHERE condition1 AND condition2?"
 */

import type { AnalyticsMetric, Employee, Order, Repository } from './datasets'
import type { Question } from './types'
import { QUESTION_LIMITS, QUESTION_THRESHOLDS } from './constants'
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

  if (tabular.length > 0) {
    // Field retrieval: specific employees
    for (let i = 0; i < Math.min(QUESTION_LIMITS.tabular.fieldRetrieval, tabular.length); i++) {
      const emp = tabular[i * 2] || tabular[i]
      if (!emp)
        continue

      // Rotate through all field types
      if (i % 5 === 0) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `What is the salary of ${emp.name}?`,
          groundTruth: String(emp.salary),
          type: 'field-retrieval',
          dataset: 'tabular',
        })
      }
      else if (i % 5 === 1) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `What department does ${emp.name} work in?`,
          groundTruth: emp.department,
          type: 'field-retrieval',
          dataset: 'tabular',
        })
      }
      else if (i % 5 === 2) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `What is the email address of ${emp.name}?`,
          groundTruth: emp.email,
          type: 'field-retrieval',
          dataset: 'tabular',
        })
      }
      else if (i % 5 === 3) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `How many years of experience does ${emp.name} have?`,
          groundTruth: String(emp.yearsExperience),
          type: 'field-retrieval',
          dataset: 'tabular',
        })
      }
      else {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `Is ${emp.name} an active employee?`,
          groundTruth: emp.active ? 'yes' : 'no',
          type: 'field-retrieval',
          dataset: 'tabular',
        })
      }
    }

    // Aggregation: count by department
    const departments = [...new Set(tabular.map(e => e.department))]
    for (const dept of departments.slice(0, QUESTION_LIMITS.tabular.aggregationDepartments)) {
      const count = tabular.filter(e => e.department === dept).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many employees work in ${dept}?`,
        groundTruth: String(count),
        type: 'aggregation',
        dataset: 'tabular',
      })
    }

    // Aggregation: salary ranges (single-condition filters)
    for (const threshold of QUESTION_THRESHOLDS.tabular.salaryRanges) {
      const count = tabular.filter(e => e.salary > threshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many employees have a salary greater than ${threshold}?`,
        groundTruth: String(count),
        type: 'aggregation',
        dataset: 'tabular',
      })
    }

    // Aggregation: totals and averages
    const totalEmployees = tabular.length
    const avgSalary = Math.round(tabular.reduce((sum, e) => sum + e.salary, 0) / totalEmployees)
    const activeCount = tabular.filter(e => e.active).length
    const inactiveCount = tabular.filter(e => !e.active).length

    questions.push(
      {
        id: `q${idCounter++}`,
        prompt: 'How many employees are in the dataset?',
        groundTruth: String(totalEmployees),
        type: 'aggregation',
        dataset: 'tabular',
      },
      {
        id: `q${idCounter++}`,
        prompt: 'What is the average salary across all employees?',
        groundTruth: String(avgSalary),
        type: 'aggregation',
        dataset: 'tabular',
      },
      {
        id: `q${idCounter++}`,
        prompt: 'How many employees are active?',
        groundTruth: String(activeCount),
        type: 'aggregation',
        dataset: 'tabular',
      },
      {
        id: `q${idCounter++}`,
        prompt: 'How many employees are inactive?',
        groundTruth: String(inactiveCount),
        type: 'aggregation',
        dataset: 'tabular',
      },
    )

    // Filtering: count by department with salary filter (multi-condition)
    for (const dept of departments.slice(0, QUESTION_LIMITS.tabular.filteringMultiConditionDepartments)) {
      const count = tabular.filter(e => e.department === dept && e.salary > QUESTION_THRESHOLDS.tabular.departmentSalaryThreshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many employees in ${dept} have a salary greater than ${QUESTION_THRESHOLDS.tabular.departmentSalaryThreshold}?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'tabular',
      })
    }

    // Filtering: active employees by experience (multi-condition)
    for (const exp of QUESTION_THRESHOLDS.tabular.experienceYears.slice(0, QUESTION_LIMITS.tabular.filteringExperience)) {
      const count = tabular.filter(e => e.yearsExperience > exp && e.active).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many active employees have more than ${exp} years of experience?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'tabular',
      })
    }

    // Filtering: department by experience (multi-condition)
    for (const dept of departments.slice(0, QUESTION_LIMITS.tabular.filteringDepartmentExp)) {
      const count = tabular.filter(e => e.department === dept && e.yearsExperience > QUESTION_THRESHOLDS.tabular.departmentExperienceThreshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many employees in ${dept} have more than ${QUESTION_THRESHOLDS.tabular.departmentExperienceThreshold} years of experience?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'tabular',
      })
    }

    // Filtering: department by active status (multi-condition)
    for (const dept of departments.slice(0, QUESTION_LIMITS.tabular.filteringDepartmentActive)) {
      const count = tabular.filter(e => e.department === dept && e.active).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many active employees work in ${dept}?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'tabular',
      })
    }
  }

  if (nested.length > 0) {
    // Field retrieval: order totals and statuses
    for (let i = 0; i < Math.min(QUESTION_LIMITS.nested.fieldRetrievalOrders, nested.length); i++) {
      const order = nested[i * 2] || nested[i]
      if (!order)
        continue

      if (i % 2 === 0) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `What is the total for order ${order.orderId}?`,
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

    // Field retrieval: customer info and order dates (expanded)
    for (let i = 0; i < Math.min(QUESTION_LIMITS.nested.fieldRetrievalCustomers, nested.length); i++) {
      const order = nested[i * 2 + 1] || nested[i]
      if (!order)
        continue

      if (i % 4 === 0) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `What is the customer name for order ${order.orderId}?`,
          groundTruth: order.customer.name,
          type: 'field-retrieval',
          dataset: 'nested',
        })
      }
      else if (i % 4 === 1) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `What is the customer email for order ${order.orderId}?`,
          groundTruth: order.customer.email,
          type: 'field-retrieval',
          dataset: 'nested',
        })
      }
      else if (i % 4 === 2) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `What is the order date for order ${order.orderId}?`,
          groundTruth: order.orderDate || '',
          type: 'field-retrieval',
          dataset: 'nested',
        })
      }
      else {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `How many items are in order ${order.orderId}?`,
          groundTruth: String(order.items.length),
          type: 'field-retrieval',
          dataset: 'nested',
        })
      }
    }

    // Aggregation: totals and averages
    const totalRevenue = nested.reduce((sum, o) => sum + o.total, 0)
    const avgOrderValue = totalRevenue / nested.length
    const totalOrders = nested.length
    const maxOrderValue = Math.max(...nested.map(o => o.total))

    // Count by status
    const statuses = [...new Set(nested.map(o => o.status))]
    for (const status of statuses.slice(0, QUESTION_LIMITS.nested.aggregationStatuses)) {
      const count = nested.filter(o => o.status === status).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many orders have status "${status}"?`,
        groundTruth: String(count),
        type: 'aggregation',
        dataset: 'nested',
      })
    }

    questions.push(
      {
        id: `q${idCounter++}`,
        prompt: 'What is the total revenue across all orders?',
        groundTruth: String(totalRevenue.toFixed(2)),
        type: 'aggregation',
        dataset: 'nested',
      },
      {
        id: `q${idCounter++}`,
        prompt: 'What is the average order value?',
        groundTruth: String(avgOrderValue.toFixed(2)),
        type: 'aggregation',
        dataset: 'nested',
      },
      {
        id: `q${idCounter++}`,
        prompt: 'How many orders are in the dataset?',
        groundTruth: String(totalOrders),
        type: 'aggregation',
        dataset: 'nested',
      },
      {
        id: `q${idCounter++}`,
        prompt: 'What is the highest order total?',
        groundTruth: String(maxOrderValue.toFixed(2)),
        type: 'aggregation',
        dataset: 'nested',
      },
    )

    // Aggregation: high-value orders (single-condition filter)
    for (const threshold of QUESTION_THRESHOLDS.nested.highValueOrders) {
      const count = nested.filter(o => o.total > threshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many orders have a total greater than ${threshold}?`,
        groundTruth: String(count),
        type: 'aggregation',
        dataset: 'nested',
      })
    }

    // Filtering: multi-condition queries (status AND value)
    const orderStatuses = [...new Set(nested.map(o => o.status))]
    for (const status of orderStatuses.slice(0, QUESTION_LIMITS.nested.filteringStatusAndValue)) {
      const count = nested.filter(o => o.status === status && o.total > QUESTION_THRESHOLDS.nested.statusValueThreshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many orders have status "${status}" and total greater than ${QUESTION_THRESHOLDS.nested.statusValueThreshold}?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'nested',
      })
    }

    // Filtering: status AND items count (multi-condition)
    for (const status of orderStatuses.slice(0, QUESTION_LIMITS.nested.filteringStatusAndItems)) {
      const count = nested.filter(o => o.status === status && o.items.length >= QUESTION_THRESHOLDS.nested.itemCountThreshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many orders have status "${status}" and at least ${QUESTION_THRESHOLDS.nested.itemCountThreshold} items?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'nested',
      })
    }

    // Filtering: total AND items count (multi-condition)
    for (const threshold of QUESTION_THRESHOLDS.nested.totalThresholdsForItems) {
      const count = nested.filter(o => o.total > threshold && o.items.length >= QUESTION_THRESHOLDS.nested.itemCountThreshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many orders have a total greater than ${threshold} and at least ${QUESTION_THRESHOLDS.nested.itemCountThreshold} items?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'nested',
      })
    }
  }

  if (analytics.length > 0) {
    // Field retrieval: specific dates (expanded with all metrics)
    for (let i = 0; i < Math.min(QUESTION_LIMITS.analytics.fieldRetrievalDates, analytics.length); i++) {
      const metric = analytics[i * 3] || analytics[i]
      if (!metric)
        continue

      if (i % 5 === 0) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `How many views were recorded on ${metric.date}?`,
          groundTruth: String(metric.views),
          type: 'field-retrieval',
          dataset: 'analytics',
        })
      }
      else if (i % 5 === 1) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `What was the revenue on ${metric.date}?`,
          groundTruth: String(metric.revenue),
          type: 'field-retrieval',
          dataset: 'analytics',
        })
      }
      else if (i % 5 === 2) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `What was the conversion count on ${metric.date}?`,
          groundTruth: String(metric.conversions),
          type: 'field-retrieval',
          dataset: 'analytics',
        })
      }
      else if (i % 5 === 3) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `How many clicks were recorded on ${metric.date}?`,
          groundTruth: String(metric.clicks),
          type: 'field-retrieval',
          dataset: 'analytics',
        })
      }
      else {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `What was the bounce rate on ${metric.date}?`,
          groundTruth: String(metric.bounceRate),
          type: 'field-retrieval',
          dataset: 'analytics',
        })
      }
    }

    // Aggregation: totals and averages
    const totalViews = analytics.reduce((sum, m) => sum + m.views, 0)
    const totalRevenue = analytics.reduce((sum, m) => sum + m.revenue, 0)
    const totalConversions = analytics.reduce((sum, m) => sum + m.conversions, 0)
    const avgViews = Math.round(totalViews / analytics.length)
    const avgRevenue = totalRevenue / analytics.length
    const avgConversions = Math.round(totalConversions / analytics.length)

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
      {
        id: `q${idCounter++}`,
        prompt: 'What is the average number of views per day?',
        groundTruth: String(avgViews),
        type: 'aggregation',
        dataset: 'analytics',
      },
      {
        id: `q${idCounter++}`,
        prompt: 'What is the average revenue per day?',
        groundTruth: String(avgRevenue.toFixed(2)),
        type: 'aggregation',
        dataset: 'analytics',
      },
      {
        id: `q${idCounter++}`,
        prompt: 'What is the average number of conversions per day?',
        groundTruth: String(avgConversions),
        type: 'aggregation',
        dataset: 'analytics',
      },
      {
        id: `q${idCounter++}`,
        prompt: 'How many days are included in the analytics data?',
        groundTruth: String(analytics.length),
        type: 'aggregation',
        dataset: 'analytics',
      },
      {
        id: `q${idCounter++}`,
        prompt: 'What is the highest number of views recorded in a single day?',
        groundTruth: String(Math.max(...analytics.map(m => m.views))),
        type: 'aggregation',
        dataset: 'analytics',
      },
    )

    // Aggregation: high-performing days (single-condition filters)
    for (const threshold of QUESTION_THRESHOLDS.analytics.views) {
      const count = analytics.filter(m => m.views > threshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many days had more than ${threshold} views?`,
        groundTruth: String(count),
        type: 'aggregation',
        dataset: 'analytics',
      })
    }

    // Filtering: multi-condition queries (views AND conversions)
    for (const viewThreshold of QUESTION_THRESHOLDS.analytics.viewsForFiltering) {
      const count = analytics.filter(m => m.views > viewThreshold && m.conversions > QUESTION_THRESHOLDS.analytics.conversionsForFiltering).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many days had more than ${viewThreshold} views and more than ${QUESTION_THRESHOLDS.analytics.conversionsForFiltering} conversions?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'analytics',
      })
    }

    // Filtering: views AND revenue (expanded)
    for (const revenueThreshold of QUESTION_THRESHOLDS.analytics.revenueThresholds.slice(0, 5)) {
      const count = analytics.filter(m => m.views > QUESTION_THRESHOLDS.analytics.viewsThresholdForRevenue && m.revenue > revenueThreshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many days had more than ${QUESTION_THRESHOLDS.analytics.viewsThresholdForRevenue} views and revenue greater than ${revenueThreshold}?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'analytics',
      })
    }

    // Filtering: clicks AND conversions (multi-condition)
    for (const clickThreshold of QUESTION_THRESHOLDS.analytics.clicksForFiltering) {
      const count = analytics.filter(m => m.clicks > clickThreshold && m.conversions > QUESTION_THRESHOLDS.analytics.conversionsForClickFiltering).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many days had more than ${clickThreshold} clicks and more than ${QUESTION_THRESHOLDS.analytics.conversionsForClickFiltering} conversions?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'analytics',
      })
    }

    // Filtering: revenue AND bounce rate (multi-condition)
    for (const revenueThreshold of QUESTION_THRESHOLDS.analytics.revenueForBounceRate) {
      const count = analytics.filter(m => m.revenue > revenueThreshold && m.bounceRate < QUESTION_THRESHOLDS.analytics.bounceRateThreshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many days had revenue greater than ${revenueThreshold} and bounce rate less than ${QUESTION_THRESHOLDS.analytics.bounceRateThreshold}?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'analytics',
      })
    }
  }

  if (github.length > 0) {
    // Helper to extract owner from repo field
    const getOwner = (repoFullName: string) => repoFullName.split('/')[0]!

    // Field retrieval: specific repos (diverse fields)
    for (let i = 0; i < Math.min(QUESTION_LIMITS.github.fieldRetrievalRepos, github.length); i++) {
      const repo = github[i * 7]
      if (!repo)
        continue

      if (i % 5 === 0) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `How many stars does ${repo.repo} have?`,
          groundTruth: String(repo.stars),
          type: 'field-retrieval',
          dataset: 'github',
        })
      }
      else if (i % 5 === 1) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `How many forks does ${repo.repo} have?`,
          groundTruth: String(repo.forks),
          type: 'field-retrieval',
          dataset: 'github',
        })
      }
      else if (i % 5 === 2) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `Who is the owner of ${repo.repo}?`,
          groundTruth: getOwner(repo.repo),
          type: 'field-retrieval',
          dataset: 'github',
        })
      }
      else if (i % 5 === 3) {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `What is the default branch of ${repo.repo}?`,
          groundTruth: repo.defaultBranch,
          type: 'field-retrieval',
          dataset: 'github',
        })
      }
      else {
        questions.push({
          id: `q${idCounter++}`,
          prompt: `How many watchers does ${repo.repo} have?`,
          groundTruth: String(repo.watchers),
          type: 'field-retrieval',
          dataset: 'github',
        })
      }
    }

    // Aggregation: popular repositories
    const totalStars = github.reduce((sum, r) => sum + r.stars, 0)
    const totalRepos = github.length
    const avgStars = Math.round(totalStars / totalRepos)

    questions.push(
      {
        id: `q${idCounter++}`,
        prompt: 'What is the total number of stars across all repositories?',
        groundTruth: String(totalStars),
        type: 'aggregation',
        dataset: 'github',
      },
      {
        id: `q${idCounter++}`,
        prompt: 'How many repositories are in the dataset?',
        groundTruth: String(totalRepos),
        type: 'aggregation',
        dataset: 'github',
      },
      {
        id: `q${idCounter++}`,
        prompt: 'What is the average number of stars per repository?',
        groundTruth: String(avgStars),
        type: 'aggregation',
        dataset: 'github',
      },
    )

    // Aggregation: star thresholds (single-condition filters)
    for (const threshold of QUESTION_THRESHOLDS.github.stars) {
      const count = github.filter(r => r.stars > threshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many repositories have more than ${threshold} stars?`,
        groundTruth: String(count),
        type: 'aggregation',
        dataset: 'github',
      })
    }

    // Aggregation: fork thresholds (single-condition filters)
    for (const threshold of QUESTION_THRESHOLDS.github.forks) {
      const count = github.filter(r => r.forks > threshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many repositories have more than ${threshold} forks?`,
        groundTruth: String(count),
        type: 'aggregation',
        dataset: 'github',
      })
    }

    // Aggregation: watcher thresholds (single-condition filters)
    for (const threshold of QUESTION_THRESHOLDS.github.watchers) {
      const count = github.filter(r => r.watchers > threshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many repositories have more than ${threshold} watchers?`,
        groundTruth: String(count),
        type: 'aggregation',
        dataset: 'github',
      })
    }

    // Aggregation: default branch counts
    const branches = [...new Set(github.map(r => r.defaultBranch))]
    for (const branch of branches.slice(0, QUESTION_LIMITS.github.aggregationBranches)) {
      const count = github.filter(r => r.defaultBranch === branch).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many repositories use "${branch}" as their default branch?`,
        groundTruth: String(count),
        type: 'aggregation',
        dataset: 'github',
      })
    }

    // Filtering: multi-condition queries (stars AND forks)
    for (const combo of QUESTION_THRESHOLDS.github.starForkCombinations.slice(0, QUESTION_LIMITS.github.filteringStarsAndForks)) {
      const count = github.filter(r => r.stars > combo.stars && r.forks > combo.forks).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many repositories have more than ${combo.stars} stars and more than ${combo.forks} forks?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'github',
      })
    }

    // Filtering: stars AND watchers (multi-condition)
    for (const combo of QUESTION_THRESHOLDS.github.starWatcherCombinations) {
      const count = github.filter(r => r.stars > combo.stars && r.watchers > combo.watchers).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many repositories have more than ${combo.stars} stars and more than ${combo.watchers} watchers?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'github',
      })
    }
  }

  return questions
}
