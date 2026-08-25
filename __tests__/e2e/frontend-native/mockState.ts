import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The on-disk handshake between the mocked Next server and Playwright.
 *
 * The failure this exists to prevent is the expensive one: a suite that runs green against the
 * live AFP API because interception silently did not happen. `.invalid` upstream hosts make that
 * impossible to do quietly, and these checks make it impossible to do at all.
 */
export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const stateDir = join(repoRoot, '.e2e-mocks')

export const missingFixturesPath = join(stateDir, 'missing-fixtures.jsonl')

export function scenariosSha(): string {
  const scenarios = readFileSync(join(repoRoot, '__tests__/e2e/mocks/scenarios.json'))
  return createHash('sha256').update(scenarios).digest('hex')
}

function readJson(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? { ...parsed } : null
  } catch {
    return null
  }
}

const RUN_COMMAND = 'Run `pnpm test:e2e:native`, which builds and starts the mocked server.'

/** Every reason the server on the configured port is not one we are willing to test against. */
export function mockServerProblems(port: string): string[] {
  const problems: string[] = []
  const active = readJson(join(stateDir, 'active.json'))
  const build = readJson(join(stateDir, 'build.json'))
  const expected = scenariosSha()

  if (!active) {
    return [
      `No .e2e-mocks/active.json — the server on :${port} is not the mocked one. ${RUN_COMMAND}`,
    ]
  }

  if (typeof active.pid === 'number') {
    try {
      process.kill(active.pid, 0)
    } catch {
      problems.push(`The mocked server (pid ${active.pid}) is no longer running. ${RUN_COMMAND}`)
    }
  }
  if (active.port !== port) {
    problems.push(`The mocked server reports port ${active.port}, but the suite targets ${port}.`)
  }
  if (active.scenariosSha !== expected) {
    problems.push(
      'The running server was started from a different scenarios.json. Stop it ' +
        `(kill ${String(active.pid)}) and re-run.`,
    )
  }

  if (!build) {
    problems.push(`No .e2e-mocks/build.json — nothing records a mocked build. ${RUN_COMMAND}`)
  } else {
    const distDir = typeof active.distDir === 'string' ? active.distDir : '.next-e2e'
    const buildIdPath = join(repoRoot, distDir, 'BUILD_ID')
    const buildId = existsSync(buildIdPath) ? readFileSync(buildIdPath, 'utf8').trim() : null
    if (build.buildId !== buildId) {
      problems.push(`${distDir} holds a different build than the one recorded as mocked.`)
    }
    // What the running server booted from, not what is on disk now. The check above cannot see
    // this: a rebuild rewrites build.json and BUILD_ID together, so a server still serving the
    // previous build agrees with both — and `reuseExistingServer` will happily hand it to us.
    if (active.buildId !== buildId) {
      problems.push(
        `The mocked server is serving build ${String(active.buildId)}, but ${distDir} now holds ` +
          `${String(buildId)}. Stop it (kill ${String(active.pid)}) and re-run.`,
      )
    }
    if (build.scenariosSha !== expected) {
      problems.push('The mocked build predates the current scenarios.json. Rebuild it.')
    }
  }

  return problems
}

/**
 * Unmapped upstream calls recorded by the mock. Any entry is a harness bug: the page under test
 * silently degraded to "Unable to load forecast data" rather than rendering the fixture.
 */
export function missingFixtures(): string[] {
  if (!existsSync(missingFixturesPath)) return []
  return [
    ...new Set(
      readFileSync(missingFixturesPath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const entry: unknown = JSON.parse(line)
          if (entry && typeof entry === 'object' && 'url' in entry && 'phase' in entry) {
            return `[${String(entry.phase)}] ${String(entry.url)}`
          }
          return line
        }),
    ),
  ]
}

export function clearMissingFixtures(): void {
  writeFileSync(missingFixturesPath, '')
}
