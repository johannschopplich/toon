import type { Question } from '../src/types'
import * as path from 'node:path'
import process from 'node:process'
import * as prompts from '@clack/prompts'
import PQueue from 'p-queue'
import { DEFAULT_CONCURRENCY, DRY_RUN, DRY_RUN_LIMITS, MODEL_RPM_LIMITS, ROOT_DIR } from '../src/constants'
import { datasets } from '../src/datasets'
import { evaluateQuestion, models } from '../src/evaluate'
import { formatters } from '../src/formatters'
import { generateQuestions } from '../src/questions'
import { calculateFormatResults, calculateTokenCounts, saveResults } from '../src/report'
import { getAllModelResults, hasModelResults, saveModelResults } from '../src/storage'

prompts.intro('Retrieval Accuracy Benchmark')

// Prompt user to select which models to benchmark
const modelChoices = models.map(({ modelId }) => ({
  value: modelId,
  label: modelId,
}))

const selectedModels = await prompts.multiselect({
  message: 'Select models to benchmark (Space to select, Enter to confirm)',
  options: modelChoices,
  required: true,
})

if (prompts.isCancel(selectedModels)) {
  prompts.cancel('Benchmark cancelled')
  process.exit(0)
}

const activeModels = models.filter(m => selectedModels.includes(m.modelId))

prompts.log.info(`Selected ${activeModels.length} model(s): ${activeModels.map(m => m.modelId).join(', ')}`)

// Check which models already have results
const existingModelResults: Record<string, boolean> = {}
for (const model of activeModels) {
  const existingResult = await hasModelResults(model.modelId)
  if (existingResult)
    existingModelResults[model.modelId] = existingResult
}

if (Object.keys(existingModelResults).length > 0) {
  prompts.log.info(`Found existing results for ${Object.values(existingModelResults).length} model(s)`)
}

if (DRY_RUN) {
  prompts.log.info('Limiting questions and models for dry run')
}

let questions = generateQuestions()

// Apply dry run limits if enabled
if (DRY_RUN && DRY_RUN_LIMITS.maxQuestions) {
  questions = questions.slice(0, DRY_RUN_LIMITS.maxQuestions)
}

prompts.log.info(`Evaluating ${questions.length} questions`)
prompts.log.info(`Testing ${Object.keys(formatters).length} formats`)

// Evaluate each model separately and save results incrementally
for (const model of activeModels) {
  const modelId = model.modelId

  // Skip if results already exist
  if (existingModelResults[modelId]) {
    prompts.log.info(`Skipping ${modelId} (results already exist)`)
    continue
  }

  prompts.log.step(`Running benchmark for ${modelId}`)

  // Generate evaluation tasks for this model
  const tasks: { question: Question, formatName: string }[] = []
  for (const question of questions) {
    for (const [formatName] of Object.entries(formatters)) {
      tasks.push({ question, formatName })
    }
  }

  const total = tasks.length
  const rpmLimit = MODEL_RPM_LIMITS[modelId]
  const queue = new PQueue({
    concurrency: DEFAULT_CONCURRENCY,
    intervalCap: rpmLimit,
    interval: rpmLimit ? 60_000 : undefined,
  })

  const evalSpinner = prompts.spinner()
  evalSpinner.start(`Running ${total} evaluations (concurrency: ${DEFAULT_CONCURRENCY}, RPM limit: ${rpmLimit ?? 'unlimited'})`)

  let completed = 0

  // Queue all tasks
  const modelResultPromises = tasks.map(task =>
    queue.add(async () => {
      // Format data on-demand
      const dataset = datasets.find(d => d.name === task.question.dataset)!
      const formatter = formatters[task.formatName]!
      const formattedData = formatter(dataset.data)

      const result = await evaluateQuestion({
        question: task.question,
        formatName: task.formatName,
        formattedData,
        model,
      })

      // Progress update after task completes
      completed++
      if (completed % 10 === 0 || completed === total) {
        const percent = ((completed / total) * 100).toFixed(1)
        evalSpinner.message(`Progress: ${completed}/${total} (${percent}%)`)
      }

      return result
    }),
  )

  // Wait for all tasks to complete
  const modelResults = await Promise.all(modelResultPromises)

  evalSpinner.stop(`Evaluation complete for ${modelId}`)

  // Save results immediately for this model
  await saveModelResults(modelId, modelResults)
  prompts.log.success(`Saved results for ${modelId}`)
}

// Generate/regenerate markdown report from all available model results
const reportSpinner = prompts.spinner()
reportSpinner.start('Generating report from all model results')

// Load all available model results (including any that were skipped)
const allModelResults = await getAllModelResults()
const allResults = Object.values(allModelResults).flat()

if (allResults.length === 0) {
  prompts.log.warn('No results available to generate report')
  process.exit(0)
}

// Calculate token counts freshly (deterministic, no need to persist)
const tokenCounts = calculateTokenCounts(formatters)

// Calculate format statistics and save report
const formatResults = calculateFormatResults(allResults, tokenCounts)
const resultsDir = await saveResults(allResults, formatResults, questions, tokenCounts)

const reportPath = path.join(resultsDir, 'retrieval-accuracy.md')
prompts.log.info(`Report saved to: \`${path.relative(ROOT_DIR, reportPath)}\``)
reportSpinner.stop('Report generation complete!')
