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
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { consola } from 'consola'

/**
 * Models used for evaluation
 */
export const models: Record<string, LanguageModelV2> = {
  'gpt-5-nano': openai('gpt-5-nano'),
  'claude-haiku-4-5': anthropic('claude-haiku-4-5-20251001'),
}

/**
 * Evaluate a single question with a specific format and model
 */
export async function evaluateQuestion(
  { question, formatName, formattedData, model}:
  { question: Question, formatName: string, formattedData: string, model: LanguageModelV2 },
): Promise<EvaluationResult> {
  const prompt = `Given the following data in ${formatName} format:

\`\`\`
${formattedData}
\`\`\`

Question: ${question.prompt}

Provide only the direct answer, without any additional explanation or formatting.`

  const startTime = performance.now()
  const { text, usage } = await generateText({
    model,
    prompt,
    temperature: model.modelId.startsWith('gpt-') ? undefined : 0,
  })

  const latencyMs = performance.now() - startTime
  const isCorrect = await validateAnswer({
    actual: text.trim(),
    expected: question.groundTruth,
    question: question.prompt,
  })

  return {
    questionId: question.id,
    format: formatName,
    model: model.modelId,
    expected: question.groundTruth,
    actual: text.trim(),
    isCorrect,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    latencyMs,
  }
}

/**
 * Validate an answer using LLM-as-judge approach
 */
async function validateAnswer(
  {
    actual,
    expected,
    question,
  }:
  { actual: string, expected: string, question: string },
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
      model: models['claude-haiku-4-5']!,
      prompt,
      temperature: 0,
    })

    return text.trim().toUpperCase() === 'YES'
  }
  catch (error) {
    consola.error('Validation error:', error)
    // Fallback to simple string comparison
    return actual.toLowerCase().trim() === expected.toLowerCase().trim()
  }
}
