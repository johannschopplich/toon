export interface Dataset {
  name: string
  description: string
  data: Record<string, any>
}

export interface Question {
  id: string
  prompt: string
  groundTruth: string
  type: 'field-retrieval' | 'aggregation' | 'filtering' | 'comparison'
  dataset: string
}

export interface EvaluationResult {
  questionId: string
  format: string
  model: string
  expected: string
  actual: string
  isCorrect: boolean
  inputTokens?: number
  outputTokens?: number
  latencyMs: number
}

export interface FormatResult {
  format: string
  accuracy: number
  totalTokens: number
  averageLatency: number
  correctCount: number
  totalCount: number
}

export interface EfficiencyRanking {
  format: string
  efficiency: number
  accuracy: number
  tokens: number
}
