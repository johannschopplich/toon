import * as path from 'node:path'
import process from 'node:process'
import { consola } from 'consola'
import { ofetch } from 'ofetch'
import pMap from 'p-map'
import { BENCHMARKS_DIR } from '../src/constants'
import { ensureDir, saveJsonFile } from '../src/utils'

try {
  // Fetch top 100 repos from GitHub
  const repoList = await searchTop100Repos()
  const repos = await fetchRepoDetails(repoList)

  if (repos.length === 0) {
    consola.error('❌ No repositories fetched. Exiting.')
    process.exit(1)
  }

  // Sort by stars descending
  repos.sort((a, b) => b.stars - a.stars)

  await saveRepos(repos)

  consola.success('Done!')
}
catch (error) {
  consola.error(error)
  process.exit(1)
}

async function searchTop100Repos(): Promise<string[]> {
  consola.start('Fetching top 100 starred repositories from GitHub API…')

  const response = await ofetch<{ items: { full_name: string }[] }>(
    'https://api.github.com/search/repositories',
    {
      query: {
        q: 'stars:>1',
        sort: 'stars',
        order: 'desc',
        per_page: 100,
      },
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  )

  return response.items.map(item => item.full_name)
}

async function fetchRepoDetails(repoList: string[]): Promise<Record<string, any>[]> {
  consola.start(`Fetching ${repoList.length} GitHub repositories…`)

  const repos = await pMap(
    repoList,
    async (repoPath, index) => {
      consola.info(`[${index + 1}/${repoList.length}] Fetching ${repoPath}…`)
      const { repo } = await ofetch(`https://ungh.cc/repos/${repoPath}`)
      return repo
    },
    { concurrency: 5 },
  )

  consola.success(`Successfully fetched ${repos.length}/${repoList.length} repositories`)

  return repos
}

async function saveRepos(repos: Record<string, any>[]): Promise<void> {
  const outputDir = path.join(BENCHMARKS_DIR, 'data')
  const outputFile = path.join(outputDir, 'github-repos.json')

  await ensureDir(outputDir)
  await saveJsonFile(outputFile, repos)

  const relativePath = path.relative(BENCHMARKS_DIR, outputFile)
  consola.info(`Saved to \`${relativePath}\``)
}
