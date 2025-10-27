import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import process from 'node:process'
import { consola } from 'consola'
import { ofetch } from 'ofetch'
import { BENCHMARKS_DIR } from '../src/constants'

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

  const repos: Record<string, any>[] = []

  for (let i = 0; i < repoList.length; i++) {
    const repoPath = repoList[i]!
    console.log(`[${i + 1}/${repoList.length}] Fetching ${repoPath}…`)
    const { repo } = await await ofetch(`https://ungh.cc/repos/${repoPath}`)
    repos.push(repo)
  }

  consola.success(`Successfully fetched ${repos.length}/${repoList.length} repositories`)

  return repos
}

async function saveRepos(repos: Record<string, any>[]): Promise<void> {
  const outputDir = path.join(BENCHMARKS_DIR, 'data')
  const outputFile = path.join(outputDir, 'github-repos.json')

  await fsp.mkdir(outputDir, { recursive: true })
  await fsp.writeFile(outputFile, JSON.stringify(repos, undefined, 2))

  const relativePath = path.relative(BENCHMARKS_DIR, outputFile)
  consola.info(`Saved to \`${relativePath}\``)
}
