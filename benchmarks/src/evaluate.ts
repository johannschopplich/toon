import type { LanguageModelV2 } from '@ai-sdk/provider'
import type { EvaluationResult, Question } from './types'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { xai } from '@ai-sdk/xai'
import { generateText } from 'ai'

/**
 * Models used for evaluation
 */
export const models: LanguageModelV2[] = [
  anthropic('claude-haiku-4-5-20251001'),
  google('gemini-2.5-flash'),
  openai('gpt-5-nano'),
  xai('grok-4-fast-non-reasoning'),
]

/**
 * Format primers
 *
 * @remarks
 * Neutral descriptions to help models parse each format.
 */
export const PRIMERS: Record<string, string> = {
  'toon': 'TOON: Indentation-based. Arrays declare length and fields (e.g., items[N]{f1,f2}:). Rows use single delimiter. Values may be quoted.',
  'json-pretty': 'JSON: Strict JSON objects/arrays with repeated keys per row.',
  'json-compact': 'JSON (compact): Strict JSON without extra whitespace.',
  'yaml': 'YAML: Indentation-based key/value and lists (- items).',
  'xml': 'XML: Tag-based tree structure with nested elements.',
  'csv': 'CSV: Header row, comma-separated values. First row contains field names.',
}

/**
 * Code fence language tags for proper syntax highlighting
 */
export const FENCE: Record<string, string> = {
  'toon': 'toon',
  'json-pretty': 'json',
  'json-compact': 'json',
  'yaml': 'yaml',
  'xml': 'xml',
  'csv': 'csv',
}

/**
 * Evaluate a single question with a specific format and model
 */
export async function evaluateQuestion(
  {
    question,
    formatName,
    formattedData,
    model,
  }:
  {
    question: Question
    formatName: string
    formattedData: string
    model: LanguageModelV2
  },
): Promise<EvaluationResult> {
  const primer = PRIMERS[formatName] ?? ''
  const fence = FENCE[formatName] ?? ''

  const prompt = `
${primer}

Given the following data in ${formatName} format:

\`\`\`${fence}
${formattedData}
\`\`\`

Question: ${question.prompt}

Provide only the direct answer, without any additional explanation or formatting.
`.trim()

  const startTime = performance.now()
  const { text, usage } = await generateText({ model, prompt })

  const actual = text.trim()
  const latencyMs = performance.now() - startTime

  const isCorrect = await validateAnswer({
    actual,
    expected: question.groundTruth,
    question: question.prompt,
  })

  return {
    questionId: question.id,
    format: formatName,
    model: model.modelId,
    expected: question.groundTruth,
    actual,
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
  {
    actual: string
    expected: string
    question: string
  },
): Promise<boolean> {
  const prompt = `
You are validating answers to questions about structured data.

Question: ${question}
Expected answer: ${expected}
Actual answer: ${actual}

Is the actual answer correct? Consider:
- Exact matches are correct
- Semantically equivalent answers are correct (e.g., "50000" vs "$50,000" vs "50000 dollars")
- Minor formatting differences are acceptable
- Case-insensitive comparison for text

Respond with only "YES" or "NO".
`.trim()

  const { text } = await generateText({
    model: models.find(m => m.modelId === 'gpt-5-nano')!,
    prompt,
  })

  return text.trim().toUpperCase() === 'YES'
}
