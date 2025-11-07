import type { AnalyticsMetric, Employee, EventLog, NestedConfig, Order, Repository } from '../datasets'
import type { Question } from '../types'
import { ACCURACY_DATASETS } from '../datasets'
import { generateAnalyticsQuestions } from './analytics'
import { generateEventLogsQuestions } from './event-logs'
import { generateGithubQuestions } from './github'
import { generateNestedQuestions } from './nested'
import { generateNestedConfigQuestions } from './nested-config'
import { generateStructuralValidationQuestions } from './structural-validation'
import { generateStructureQuestions } from './structure'
import { generateTabularQuestions } from './tabular'
import { createIdGenerator } from './utils'

/**
 * Generate questions from all datasets
 *
 * @remarks
 * - Field Retrieval: Direct field access with no computation
 *   Examples: "What is X's salary?", "What is the status of order Y?"
 * - Aggregation: Counts, sums, averages, min/max operations (including single-condition filters)
 *   Examples: "How many X?", "What is the total/average?", "How many X > threshold?"
 * - Filtering: Multi-condition queries requiring complex logical operations
 *   Examples: "How many X WHERE condition1 AND condition2?"
 * - Structure Awareness: Tests format-native structural affordances (TOON's [N] and {fields}, CSV's header)
 *   Examples: "How many records?", "List the field names", "What is the last record's field?"
 */
export function generateQuestions(): Question[] {
  const questions: Question[] = []
  const idGen = createIdGenerator()
  const getId = () => idGen.next().value

  // Get datasets with proper typing
  const tabular = (ACCURACY_DATASETS.find(d => d.name === 'tabular')?.data.employees as Employee[]) ?? []
  const nested = (ACCURACY_DATASETS.find(d => d.name === 'nested')?.data.orders as Order[]) ?? []
  const analytics = (ACCURACY_DATASETS.find(d => d.name === 'analytics')?.data.metrics as AnalyticsMetric[]) ?? []
  const github = (ACCURACY_DATASETS.find(d => d.name === 'github')?.data.repositories as Repository[]) ?? []
  const eventLogs = (ACCURACY_DATASETS.find(d => d.name === 'event-logs')?.data.logs as EventLog[]) ?? []
  const nestedConfig = ACCURACY_DATASETS.find(d => d.name === 'nested-config')?.data as NestedConfig | undefined

  // Generate questions for each dataset
  questions.push(...generateTabularQuestions(tabular, getId))
  questions.push(...generateNestedQuestions(nested, getId))
  questions.push(...generateAnalyticsQuestions(analytics, getId))
  questions.push(...generateGithubQuestions(github, getId))
  questions.push(...generateEventLogsQuestions(eventLogs, getId))
  questions.push(...generateNestedConfigQuestions(nestedConfig, getId))

  // Generate structure-awareness questions (tests format-native affordances)
  questions.push(...generateStructureQuestions(tabular, nested, analytics, github, eventLogs, getId))

  // Generate structural-validation questions (tests ability to detect corrupted data)
  questions.push(...generateStructuralValidationQuestions(getId))

  return questions
}
