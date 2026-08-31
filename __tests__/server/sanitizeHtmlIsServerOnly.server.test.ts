/**
 * `sanitize-html` must stay out of the client bundle.
 *
 * The library is ~230 KB minified once htmlparser2's tokenizer comes with it, and every reader of a
 * native forecast page would download it. It got there once already (#1234) by way of a single
 * `sanitizeHtml` call inside a `'use client'` component, which is invisible in review — the import
 * looks like every other import in the file.
 *
 * So this walks the import graph the compiler will walk: from every module carrying the
 * `'use client'` directive, follow the edges that survive compilation and assert the sanitizer is
 * not among the modules reached. `import type { … } from` is erased and is not an edge, which is
 * what lets a client component name the `LightboxMedia` type without pulling its builders along.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const ROOT = resolve(process.cwd())
const SRC = join(ROOT, 'src')
const SANITIZER = join(SRC, 'components/forecast/sanitizeHtml.ts')

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs']

/**
 * A `from '…'` specifier that survives compilation.
 *
 * The `type` lookahead skips `import type … from` / `export type … from`, which TypeScript erases
 * outright. A bare `import { type X } from` is deliberately *not* skipped: without
 * `verbatimModuleSyntax` it is usually elided too, but the guarantee is weaker than a real
 * `import type`, so this counts it as an edge and forces the stronger form at the boundary.
 */
const STATIC_IMPORT = /(?:^|\n)\s*(?:import|export)(?!\s+type\b)[\s\S]*?\bfrom\s*['"]([^'"]+)['"]/g
const DYNAMIC_IMPORT = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g
const USE_CLIENT = /(?:^|\n)\s*['"]use client['"]\s*;?\s*(?:\n|$)/

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return EXTENSIONS.some((ext) => entry.name.endsWith(ext)) ? [full] : []
  })
}

/** The file a specifier resolves to, or `null` for a package (outside the graph we care about). */
function resolveSpecifier(specifier: string, fromFile: string): string | null {
  let base: string
  if (specifier.startsWith('@/')) base = join(SRC, specifier.slice(2))
  else if (specifier.startsWith('.')) base = resolve(dirname(fromFile), specifier)
  else return null

  for (const ext of EXTENSIONS) {
    if (existsSync(base + ext)) return base + ext
  }
  if (!existsSync(base)) return null
  if (statSync(base).isFile()) return base

  for (const ext of EXTENSIONS) {
    const index = join(base, `index${ext}`)
    if (existsSync(index)) return index
  }
  return null
}

function importsOf(file: string): string[] {
  const source = readFileSync(file, 'utf8')
  const specifiers = [...source.matchAll(STATIC_IMPORT), ...source.matchAll(DYNAMIC_IMPORT)].map(
    (match) => match[1],
  )

  return [...new Set(specifiers)]
    .map((specifier) => resolveSpecifier(specifier, file))
    .filter((resolved): resolved is string => resolved !== null)
}

/** Walk the breadth-first search back from `file` to the entry point that reached it. */
function trace(file: string, cameFrom: Map<string, string>): string[] {
  const chain = [file]
  for (let step = cameFrom.get(file); step; step = cameFrom.get(step)) chain.unshift(step)
  return chain
}

/** The import chain from one of `entries` to `target`, or `null` if it cannot be reached. */
function chainTo(target: string, entries: string[]): string[] | null {
  // An entry maps to '' — the walk back in `trace` stops there rather than at a sentinel.
  const cameFrom = new Map(entries.map((entry) => [entry, '']))
  const queue = [...entries]

  for (let i = 0; i < queue.length; i++) {
    for (const next of importsOf(queue[i])) {
      if (cameFrom.has(next)) continue
      cameFrom.set(next, queue[i])
      if (next === target) return trace(next, cameFrom)
      queue.push(next)
    }
  }
  return null
}

const allSources = sourceFiles(SRC)
const clientModules = allSources.filter((file) => USE_CLIENT.test(readFileSync(file, 'utf8')))
const show = (chain: string[] | null) =>
  chain && chain.map((file) => relative(ROOT, file)).join('\n  → ')

describe('sanitize-html stays on the server', () => {
  it('is not reachable from any client component', () => {
    expect(show(chainTo(SANITIZER, clientModules))).toBeNull()
  })

  // Without these the test above passes for the wrong reasons — an entry list that found no client
  // components, or a walker that resolves no edges, is indistinguishable from a clean graph.
  it('walks the client components it is meant to walk', () => {
    expect(clientModules).toContain(join(SRC, 'components/forecast/MediaLightbox.tsx'))
  })

  it('does reach the sanitizer from a server component that uses it', () => {
    const chain = chainTo(SANITIZER, [join(SRC, 'components/forecast/ForecastDiscussion.tsx')])
    expect(chain).not.toBeNull()
  })
})
