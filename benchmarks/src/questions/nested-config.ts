import type { NestedConfig } from '../datasets'
import type { Question } from '../types'
import { QUESTION_LIMITS } from '../constants'
import { QuestionBuilder } from './utils'

/**
 * Generate nested configuration questions
 */
export function generateNestedConfigQuestions(config: NestedConfig | undefined, getId: () => string): Question[] {
  const questions: Question[] = []

  if (!config)
    return questions

  // Field retrieval: top-level config values
  const fieldRetrievalQuestions = [
    {
      prompt: 'What is the environment in the configuration?',
      groundTruth: config.environment,
    },
    {
      prompt: 'What is the database host?',
      groundTruth: config.database.host,
    },
    {
      prompt: 'What is the database port?',
      groundTruth: String(config.database.port),
    },
    {
      prompt: 'What is the maximum connection pool size?',
      groundTruth: String(config.database.pool.max),
    },
    {
      prompt: 'What is the session duration?',
      groundTruth: String(config.authentication.session.duration),
    },
  ]

  for (const q of fieldRetrievalQuestions.slice(0, QUESTION_LIMITS.nestedConfig.fieldRetrieval)) {
    questions.push(
      new QuestionBuilder()
        .id(getId())
        .prompt(q.prompt)
        .groundTruth(q.groundTruth)
        .type('field-retrieval')
        .dataset('nested-config')
        .build(),
    )
  }

  // Aggregation: counts of nested structures
  const roleCount = Object.keys(config.permissions.roles).length
  const groupCount = Object.keys(config.permissions.groups).length
  const providerCount = config.authentication.providers.length
  const featureCount = Object.keys(config.features).length
  const replicaCount = config.database.replicas.length

  questions.push(
    new QuestionBuilder()
      .id(getId())
      .prompt('How many roles are defined in permissions?')
      .groundTruth(String(roleCount))
      .type('aggregation')
      .dataset('nested-config')
      .build(),
    new QuestionBuilder()
      .id(getId())
      .prompt('How many groups are defined in permissions?')
      .groundTruth(String(groupCount))
      .type('aggregation')
      .dataset('nested-config')
      .build(),
    new QuestionBuilder()
      .id(getId())
      .prompt('How many authentication providers are configured?')
      .groundTruth(String(providerCount))
      .type('aggregation')
      .dataset('nested-config')
      .build(),
    new QuestionBuilder()
      .id(getId())
      .prompt('How many feature flags are defined?')
      .groundTruth(String(featureCount))
      .type('aggregation')
      .dataset('nested-config')
      .build(),
    new QuestionBuilder()
      .id(getId())
      .prompt('How many database replicas are configured?')
      .groundTruth(String(replicaCount))
      .type('aggregation')
      .dataset('nested-config')
      .build(),
  )

  // Aggregation: feature flag details
  const enabledFeatures = Object.entries(config.features).filter(([_, f]) => f.enabled).length
  questions.push(
    new QuestionBuilder()
      .id(getId())
      .prompt('How many feature flags are enabled?')
      .groundTruth(String(enabledFeatures))
      .type('aggregation')
      .dataset('nested-config')
      .build(),
  )

  // Aggregation: role permissions
  const adminPermissions = config.permissions.roles.admin?.permissions.length ?? 0
  questions.push(
    new QuestionBuilder()
      .id(getId())
      .prompt('How many permissions does the admin role have?')
      .groundTruth(String(adminPermissions))
      .type('aggregation')
      .dataset('nested-config')
      .build(),
  )

  // Filtering: complex multi-condition queries
  const filteringQuestions = [
    {
      prompt: 'How many feature flags are enabled with rollout greater than 50%?',
      groundTruth: String(Object.entries(config.features)
        .filter(([_, f]) => f.enabled && f.rollout > 50).length),
    },
    {
      prompt: 'How many groups have the admin role?',
      groundTruth: String(Object.entries(config.permissions.groups)
        .filter(([_, g]) => g.roles.includes('admin')).length),
    },
  ]

  for (const q of filteringQuestions.slice(0, QUESTION_LIMITS.nestedConfig.filteringComplex)) {
    questions.push(
      new QuestionBuilder()
        .id(getId())
        .prompt(q.prompt)
        .groundTruth(q.groundTruth)
        .type('filtering')
        .dataset('nested-config')
        .build(),
    )
  }

  return questions
}
