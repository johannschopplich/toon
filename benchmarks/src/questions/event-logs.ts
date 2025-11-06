import type { EventLog } from '../datasets'
import type { Question } from '../types'
import { QUESTION_LIMITS } from '../constants'
import { countByPredicate, QuestionBuilder, rotateQuestions, SAMPLE_STRIDES } from './utils'

/**
 * Generate event log questions
 */
export function generateEventLogsQuestions(logs: EventLog[], getId: () => string): Question[] {
  const questions: Question[] = []

  if (logs.length === 0)
    return questions

  // Field retrieval: log metadata
  const logFieldGenerators: Array<(log: EventLog, getId: () => string) => Question> = [
    (log, getId) => new QuestionBuilder()
      .id(getId())
      .prompt(`What is the level of the log at ${log.timestamp}?`)
      .groundTruth(log.level)
      .type('field-retrieval')
      .dataset('event-logs')
      .build(),
    (log, getId) => new QuestionBuilder()
      .id(getId())
      .prompt(`What is the endpoint for the log at ${log.timestamp}?`)
      .groundTruth(log.endpoint)
      .type('field-retrieval')
      .dataset('event-logs')
      .build(),
    (log, getId) => new QuestionBuilder()
      .id(getId())
      .prompt(`What is the status code for the log at ${log.timestamp}?`)
      .groundTruth(String(log.statusCode))
      .type('field-retrieval')
      .dataset('event-logs')
      .build(),
    (log, getId) => new QuestionBuilder()
      .id(getId())
      .prompt(`What is the response time for the log at ${log.timestamp}?`)
      .groundTruth(String(log.responseTime))
      .type('field-retrieval')
      .dataset('event-logs')
      .build(),
  ]

  questions.push(...rotateQuestions(
    logs,
    logFieldGenerators,
    QUESTION_LIMITS.eventLogs.fieldRetrieval,
    SAMPLE_STRIDES.EVENT_LOG_FIELD,
    getId,
  ))

  // Aggregation: basic statistics
  const totalLogs = logs.length
  const avgResponseTime = logs.reduce((sum, l) => sum + l.responseTime, 0) / logs.length

  questions.push(
    new QuestionBuilder()
      .id(getId())
      .prompt('How many log entries are in the dataset?')
      .groundTruth(String(totalLogs))
      .type('aggregation')
      .dataset('event-logs')
      .build(),
    new QuestionBuilder()
      .id(getId())
      .prompt('What is the average response time across all logs?')
      .groundTruth(String(avgResponseTime.toFixed(2)))
      .type('aggregation')
      .dataset('event-logs')
      .build(),
  )

  // Aggregation: by level
  const levels = [...new Set(logs.map(l => l.level))]
  for (const level of levels) {
    const count = countByPredicate(logs, l => l.level === level)
    questions.push(
      new QuestionBuilder()
        .id(getId())
        .prompt(`How many log entries have level "${level}"?`)
        .groundTruth(String(count))
        .type('aggregation')
        .dataset('event-logs')
        .build(),
    )
  }

  // Aggregation: by endpoint
  const endpoints = [...new Set(logs.map(l => l.endpoint))]
  for (const endpoint of endpoints.slice(0, QUESTION_LIMITS.eventLogs.aggregationEndpoints)) {
    const count = countByPredicate(logs, l => l.endpoint === endpoint)
    questions.push(
      new QuestionBuilder()
        .id(getId())
        .prompt(`How many log entries are for endpoint "${endpoint}"?`)
        .groundTruth(String(count))
        .type('aggregation')
        .dataset('event-logs')
        .build(),
    )
  }

  // Aggregation: by status code range
  const errorCount = countByPredicate(logs, l => l.statusCode >= 400)
  const successCount = countByPredicate(logs, l => l.statusCode >= 200 && l.statusCode < 300)

  questions.push(
    new QuestionBuilder()
      .id(getId())
      .prompt('How many log entries have a status code indicating an error (>= 400)?')
      .groundTruth(String(errorCount))
      .type('aggregation')
      .dataset('event-logs')
      .build(),
    new QuestionBuilder()
      .id(getId())
      .prompt('How many log entries have a successful status code (200-299)?')
      .groundTruth(String(successCount))
      .type('aggregation')
      .dataset('event-logs')
      .build(),
  )

  // Filtering: multi-condition (level AND status)
  for (const level of levels.slice(0, QUESTION_LIMITS.eventLogs.filteringLevelAndStatus)) {
    const count = countByPredicate(
      logs,
      l => l.level === level && l.statusCode >= 400,
    )
    questions.push(
      new QuestionBuilder()
        .id(getId())
        .prompt(`How many log entries have level "${level}" and status code >= 400?`)
        .groundTruth(String(count))
        .type('filtering')
        .dataset('event-logs')
        .build(),
    )
  }

  // Filtering: endpoint AND status
  for (const endpoint of endpoints.slice(0, QUESTION_LIMITS.eventLogs.filteringEndpointAndStatus)) {
    const count = countByPredicate(
      logs,
      l => l.endpoint === endpoint && l.statusCode >= 500,
    )
    questions.push(
      new QuestionBuilder()
        .id(getId())
        .prompt(`How many log entries are for endpoint "${endpoint}" with status code >= 500?`)
        .groundTruth(String(count))
        .type('filtering')
        .dataset('event-logs')
        .build(),
    )
  }

  return questions
}
