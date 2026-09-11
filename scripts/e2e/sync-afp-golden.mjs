#!/usr/bin/env node
/**
 * Vendor the AFP products-api golden corpus into this repo, with provenance.
 *
 * The E2E mocks are served from real, PII-scrubbed v2 responses that products-api captures and
 * keeps honest (`scripts/parity_capture.py` re-fetches weekly and flags drift). Hand-authored
 * fixtures encode what we *assume* the API returns; captured goldens encode what it *does*.
 *
 * The corpus lives in a different repo, in a different language, and the CI container has no
 * checkout of it — so the honest interim is a committed snapshot plus a per-file sha256 manifest.
 * `--check` makes that snapshot tamper-evident: it runs in CI and fails if a vendored "golden" no
 * longer matches what was recorded, so a fixture cannot be quietly edited into saying what a test
 * wants. The intended end state is an npm package published from products-api CI; see
 * docs/afp-products/e2e-mocks.md.
 *
 * `sync` reads a local products-api checkout and refuses one that is dirty or behind its remote,
 * because `PROVENANCE.json`'s recorded commit is only worth anything if it describes the bytes.
 * `--check` needs neither the corpus nor the network — it re-hashes what is committed here, which
 * is why CI can run it without a checkout of a Python repo.
 *
 *   AFP_PRODUCTS_API_PATH=/path/to/products-api node scripts/e2e/sync-afp-golden.mjs
 *   AFP_PRODUCTS_API_PATH=... node scripts/e2e/sync-afp-golden.mjs --allow-stale
 *   node scripts/e2e/sync-afp-golden.mjs --check
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const mocksDir = join(repoRoot, '__tests__/e2e/mocks')
const goldenDir = join(mocksDir, 'afp-golden')
const provisionalDir = join(mocksDir, 'provisional')
const manifestPath = join(goldenDir, 'PROVENANCE.json')

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

/** Every fixture filename scenarios.json refers to, in stable order. */
export function wantedFixtures() {
  const scenarios = JSON.parse(readFileSync(join(mocksDir, 'scenarios.json'), 'utf8'))
  const names = new Set([scenarios.capabilities.fixture])

  for (const center of Object.values(scenarios.centers)) {
    for (const key of ['metadata', 'mapLayer', 'archive']) {
      if (center[key]) names.add(center[key])
    }
  }
  for (const product of scenarios.products) {
    if (product.fixture) names.add(product.fixture)
    if (product.phase) for (const name of Object.values(product.phase)) names.add(name)
  }
  for (const name of Object.values(scenarios.productsById)) names.add(name)
  for (const entry of scenarios.absent) {
    if (entry.fixture) names.add(entry.fixture)
  }

  return [...names].sort()
}

/** Filenames served from `provisional/` rather than the vendored corpus. */
function provisionalNames() {
  if (!existsSync(provisionalDir)) return new Set()
  return new Set(
    readdirSync(provisionalDir).filter(
      (name) => name.endsWith('.json') && name !== 'PROVENANCE.json',
    ),
  )
}

const GOLDEN_SUBDIR = 'api/tests/migration_parity/golden'

function tryGit(sourceRepo, args) {
  try {
    const out = execFileSync('git', ['-C', sourceRepo, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { ok: true, out: out.trim() }
  } catch {
    return { ok: false, out: '' }
  }
}

/**
 * Refuse to vendor from a checkout that does not say what `PROVENANCE.json` will claim it says.
 *
 * Two separate failures, deliberately treated differently:
 *
 * - **Uncommitted changes under the corpus** make the recorded commit a lie about the bytes, which
 *   defeats the entire point of recording it. Always fatal.
 * - **A checkout behind its remote** is honest but stale — you vendor last month's goldens and
 *   `--check` will happily confirm them forever. Fatal by default, waivable with `--allow-stale`
 *   when you are pinning to an older commit on purpose.
 *
 * The fetch is best-effort: being offline is not a reason to block a sync, but it does mean
 * freshness went unverified, so say so rather than implying it passed.
 */
function assertSourceIsCurrent(sourceRepo, { allowStale }) {
  const dirty = tryGit(sourceRepo, ['status', '--porcelain', '--', GOLDEN_SUBDIR])
  if (dirty.ok && dirty.out) {
    throw new Error(
      `${GOLDEN_SUBDIR} has uncommitted changes, so PROVENANCE.json would record a commit that ` +
        `does not match the bytes being vendored:\n  ${dirty.out.split('\n').join('\n  ')}\n` +
        'Commit or stash them in products-api first.',
    )
  }

  if (!tryGit(sourceRepo, ['fetch', '--quiet']).ok) {
    console.warn('[afp-golden] could not fetch products-api; vendoring without a freshness check')
    return
  }

  const upstream = tryGit(sourceRepo, ['rev-parse', '--abbrev-ref', '@{upstream}'])
  if (!upstream.ok) return

  const behind = tryGit(sourceRepo, ['rev-list', '--count', `HEAD..${upstream.out}`])
  if (behind.ok && Number(behind.out) > 0) {
    if (allowStale) {
      console.warn(
        `[afp-golden] HEAD is ${behind.out} commit(s) behind ${upstream.out}; vendoring anyway (--allow-stale)`,
      )
      return
    }
    throw new Error(
      `products-api HEAD is ${behind.out} commit(s) behind ${upstream.out}, so this would vendor ` +
        'stale goldens.\n  Run `git pull` there, or pass --allow-stale to pin deliberately.',
    )
  }
}

function sync({ allowStale }) {
  const sourceRepo = process.env.AFP_PRODUCTS_API_PATH
  if (!sourceRepo) {
    throw new Error(
      'AFP_PRODUCTS_API_PATH is not set. Point it at a local products-api checkout, e.g.\n' +
        '  AFP_PRODUCTS_API_PATH=~/code/monorepo/products-api pnpm afp-golden:sync',
    )
  }

  const sourceDir = resolve(sourceRepo, GOLDEN_SUBDIR)
  if (!existsSync(sourceDir)) {
    throw new Error(`No golden corpus at ${sourceDir}`)
  }

  assertSourceIsCurrent(resolve(sourceRepo), { allowStale })

  const commit = execFileSync('git', ['-C', resolve(sourceRepo), 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim()

  mkdirSync(goldenDir, { recursive: true })

  const provisional = provisionalNames()
  const files = []
  const missing = []

  for (const name of wantedFixtures()) {
    // A provisional capture is deliberately absent from the corpus — it is what we are asking
    // products-api to adopt. Skipping it here keeps the two directories disjoint.
    if (provisional.has(name)) continue

    const from = join(sourceDir, name)
    if (!existsSync(from)) {
      missing.push(name)
      continue
    }
    const bytes = readFileSync(from)
    writeFileSync(join(goldenDir, name), bytes)
    files.push({ name, sha256: sha256(bytes), bytes: bytes.length })
  }

  for (const name of readdirSync(goldenDir)) {
    if (name === 'PROVENANCE.json') continue
    if (!files.some((file) => file.name === name)) unlinkSync(join(goldenDir, name))
  }

  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        readme:
          'Generated by scripts/e2e/sync-afp-golden.mjs. Never hand-edit — `pnpm afp-golden:check` fails if a file no longer matches its recorded hash.',
        source: {
          repo: 'NationalAvalancheCenter/products-api',
          goldenDir: 'api/tests/migration_parity/golden',
          commit,
        },
        files,
      },
      null,
      2,
    )}\n`,
  )

  console.log(`Vendored ${files.length} golden(s) from products-api@${commit.slice(0, 8)}`)
  if (provisional.size > 0) {
    console.log(`Skipped ${provisional.size} provisional capture(s) held in ${provisionalDir}`)
  }
  if (missing.length > 0) {
    console.error(
      `\n${missing.length} fixture(s) referenced by scenarios.json are not in the corpus and are ` +
        `not provisional captures:\n  ${missing.join('\n  ')}\n` +
        'Either add the Case upstream (see docs/afp-products/e2e-mocks.md) or drop the reference.',
    )
    process.exitCode = 1
  }
}

function check() {
  if (!existsSync(manifestPath)) {
    throw new Error(`No ${manifestPath}. Run \`pnpm afp-golden:sync\`.`)
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const recorded = new Map(manifest.files.map((file) => [file.name, file]))
  const problems = []

  for (const [name, file] of recorded) {
    const path = join(goldenDir, name)
    if (!existsSync(path)) {
      problems.push(`${name}: recorded in PROVENANCE.json but missing on disk`)
      continue
    }
    const actual = sha256(readFileSync(path))
    if (actual !== file.sha256) {
      problems.push(`${name}: sha256 ${actual} does not match recorded ${file.sha256}`)
    }
  }

  for (const name of readdirSync(goldenDir)) {
    if (name !== 'PROVENANCE.json' && !recorded.has(name)) {
      problems.push(`${name}: present on disk but absent from PROVENANCE.json`)
    }
  }

  const provisional = provisionalNames()
  for (const name of wantedFixtures()) {
    if (!recorded.has(name) && !provisional.has(name)) {
      problems.push(`${name}: referenced by scenarios.json but neither vendored nor provisional`)
    }
  }

  if (problems.length > 0) {
    console.error(`Golden corpus check failed:\n  ${problems.join('\n  ')}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Golden corpus OK — ${recorded.size} vendored from products-api@${manifest.source.commit.slice(0, 8)}` +
      (provisional.size > 0 ? `, ${provisional.size} provisional` : ''),
  )
}

if (process.argv.includes('--check')) {
  check()
} else {
  sync({ allowStale: process.argv.includes('--allow-stale') })
}
