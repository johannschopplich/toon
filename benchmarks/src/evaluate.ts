/**
 * LLM evaluation logic for TOON benchmarks
 *
 * Handles:
 * - Model configuration
 * - Question evaluation with LLMs
 * - Answer validation using LLM-as-judge
 */

import type { LanguageModelV2 } from '@ai-sdk/provider'
import type { EvaluationResult, Question } from './types'
import { setTimeout } from 'node:timers/promises'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { consola } from 'consola'
import { RATE_LIMIT_DELAY_MS } from './constants'

/**
 * Models used for evaluation
 */
export const models: Record<string, LanguageModelV2> = {
  'gpt-4o-mini': openai('gpt-4o-mini'),
  'claude-haiku-4-5': anthropic('claude-haiku-4-5-20251001'),
}

/**
 * Validate an answer using LLM-as-judge approach
 * More robust than string matching for LLM outputs
 */
export async function validateAnswer(
  actual: string,
  expected: string,
  question: string,
): Promise<boolean> {
  const prompt = `You are validating answers to questions about structured data.

Question: ${question}
Expected answer: ${expected}
Actual answer: ${actual}

Is the actual answer correct? Consider:
- Exact matches are correct
- Semantically equivalent answers are correct (e.g., "50000" vs "$50,000" vs "50000 dollars")
- Minor formatting differences are acceptable
- Case-insensitive comparison for text

Respond with only "YES" or "NO".`

  try {
    const { text } = await generateText({
      model: models['gpt-4o-mini']!,
      prompt,
      temperature: 0,
      maxOutputTokens: 16,
    })

    await setTimeout(RATE_LIMIT_DELAY_MS)

    return text.trim().toUpperCase() === 'YES'
  }
  catch (error) {
    consola.error('Validation error:', error)
    // Fallback to simple string comparison
    return actual.toLowerCase().trim() === expected.toLowerCase().trim()
  }
}

/**
 * Evaluate a single question with a specific format and model
 */
export async function evaluateQuestion(
  question: Question,
  formatName: string,
  formattedData: string,
  model: any,
  modelName: string,
): Promise<EvaluationResult> {
  const prompt = `Given the following data in ${formatName} format:

\`\`\`
${formattedData}
\`\`\`

Question: ${question.prompt}

Provide only the direct answer, without any additional explanation or formatting.`

  const startTime = Date.now()

  try {
    const { text, usage } = await generateText({
      model,
      prompt,
      temperature: 0,
      maxOutputTokens: 50,
    })

    await setTimeout(RATE_LIMIT_DELAY_MS)

    const latencyMs = Date.now() - startTime
    const correct = await validateAnswer(text.trim(), question.groundTruth, question.prompt)

    return {
      questionId: question.id,
      format: formatName,
      model: modelName,
      expected: question.groundTruth,
      actual: text.trim(),
      correct,
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
      latencyMs,
    }
  }
  catch (error) {
    consola.error(`Error evaluating ${question.id} with ${formatName}/${modelName}:`, error)

    await setTimeout(RATE_LIMIT_DELAY_MS)

    return {
      questionId: question.id,
      format: formatName,
      model: modelName,
      expected: question.groundTruth,
      actual: '',
      correct: false,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - startTime,
    }
  }
}
