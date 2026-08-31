#!/usr/bin/env node
/**
 * Capture a v2 response that the products-api golden corpus does not cover yet, scrub it to that
 * corpus's own policy, and hold it in `__tests__/e2e/mocks/provisional/` until products-api adopts it.
 *
 * These are a staging area, not a second corpus. Each one exists because an E2E path cannot render
 * without it and the upstream Case has been filed; when the Case lands, the file moves to
 * `afp-golden/` via `pnpm afp-golden:sync` and is deleted here. Adding a capture that is NOT
 * blocking a test, or keeping one after its Case lands, is how a staging area becomes a fork.
 *
 * Scrubbing mirrors products-api's SCRUB_POLICY.md, verified field-by-field against the shape of
 * the committed `v2_public_center_SNFAC.json`: personal/contact emails become test@example.com,
 * widget_config API tokens become test_token_scrubbed. A center's published phone number stays —
 * the corpus keeps SNFAC's — as do organisational names, zone geometry and ids.
 *
 *   node scripts/e2e/capture-provisional.mjs            # re-capture every registered target
 *   node scripts/e2e/capture-provisional.mjs --verify   # scrub-check what is committed, no network
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const provisionalDir = join(repoRoot, '__tests__/e2e/mocks/provisional')
const manifestPath = join(provisionalDir, 'PROVENANCE.json')

const NAC_HOST = 'https://api.avalanche.org'

/**
 * Every provisional capture, with the upstream Case that retires it. Keep this list short and
 * keep every entry's `blocks` truthful — it is the argument for the file existing at all.
 */
const TARGETS = [
  {
    file: 'v2_public_center_NWAC.json',
    path: '/v2/public/avalanche-center/NWAC',
    upstreamCase: 'center_NWAC',
    blocks:
      'Every DVAC page. dvac aliases to nwac upstream, and getAvalancheCenterMetadata throws on a missing/unparseable response, so generateStaticParams fails the whole build without this.',
  },
  {
    file: 'v2_public_center_SAC.json',
    path: '/v2/public/avalanche-center/SAC',
    upstreamCase: 'center_SAC',
    blocks:
      'Every SAC page. SAC is the widget-mode control tenant in the native-vs-widget spec, and its layout needs center metadata to render at all.',
  },
]

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g
/** A widget API token: lowercase hex, 32+ chars, under a widget_config ancestor. */
const HEX_TOKEN = /^[a-f0-9]{32,}$/

function scrub(value, path = []) {
  if (Array.isArray(value)) return value.map((item, index) => scrub(item, [...path, String(index)]))

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, scrub(item, [...path, key])]),
    )
  }

  if (typeof value !== 'string') return value

  const key = path[path.length - 1]
  if (key === 'token' && path.includes('widget_config') && HEX_TOKEN.test(value)) {
    return 'test_token_scrubbed'
  }
  return value.replace(EMAIL, 'test@example.com')
}

/** Any value that still looks like a live secret or personal contact after scrubbing. */
function leaks(value, path = []) {
  const found = []
  if (Array.isArray(value) || (value && typeof value === 'object')) {
    for (const [key, item] of Object.entries(value)) found.push(...leaks(item, [...path, key]))
    return found
  }
  if (typeof value !== 'string') return found

  const where = path.join('.')
  if (EMAIL.test(value) && !value.includes('test@example.com')) found.push(`${where}: ${value}`)
  EMAIL.lastIndex = 0
  if (HEX_TOKEN.test(value) && value !== 'test_token_scrubbed') found.push(`${where}: <hex token>`)
  return found
}

function readManifest() {
  return existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { files: [] }
}

async function capture() {
  mkdirSync(provisionalDir, { recursive: true })
  const files = []

  for (const target of TARGETS) {
    const url = `${NAC_HOST}${target.path}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`)

    const scrubbed = scrub(await res.json())
    const remaining = leaks(scrubbed)
    if (remaining.length > 0) {
      throw new Error(`Refusing to write ${target.file} — unscrubbed:\n  ${remaining.join('\n  ')}`)
    }

    writeFileSync(join(provisionalDir, target.file), `${JSON.stringify(scrubbed, null, 2)}\n`)
    files.push({ ...target, url, capturedAt: new Date().toISOString().slice(0, 10) })
    console.log(`Captured ${target.file}`)
  }

  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        readme:
          'Captured here because the products-api golden corpus does not cover these yet. Each is blocking a listed E2E path and has an upstream Case filed; when the Case lands, sync the golden and delete the file here. See scripts/e2e/capture-provisional.mjs.',
        source: {
          host: NAC_HOST,
          scrubPolicy: 'products-api api/tests/migration_parity/golden/SCRUB_POLICY.md',
        },
        files,
      },
      null,
      2,
    )}\n`,
  )
}

function verify() {
  const manifest = readManifest()
  const problems = []

  for (const target of TARGETS) {
    const path = join(provisionalDir, target.file)
    if (!existsSync(path)) {
      problems.push(`${target.file}: registered but not committed`)
      continue
    }
    if (!manifest.files.some((file) => file.file === target.file)) {
      problems.push(`${target.file}: committed but absent from PROVENANCE.json`)
    }
    const remaining = leaks(JSON.parse(readFileSync(path, 'utf8')))
    if (remaining.length > 0) {
      problems.push(`${target.file}: unscrubbed values:\n    ${remaining.join('\n    ')}`)
    }
  }

  if (problems.length > 0) {
    console.error(`Provisional capture check failed:\n  ${problems.join('\n  ')}`)
    process.exitCode = 1
    return
  }
  console.log(`Provisional captures OK — ${TARGETS.length} awaiting upstream adoption`)
}

if (process.argv.includes('--verify')) {
  verify()
} else {
  await capture()
}
