import { readdirSync, readFileSync } from 'fs'
import path from 'path'

/**
 * Breadcrumbs render per page rather than in the [center] layout, so the page owns
 * the document title and it lands in the first server render. That makes every page
 * under the center directory responsible for rendering <Breadcrumbs>. This test reads
 * each page.tsx from disk and asserts the import, so a new route cannot silently ship
 * without a trail.
 */

const CENTER_DIR = path.join(process.cwd(), 'src/app/(frontend)/[center]')

// Pages that intentionally render no breadcrumbs, relative to CENTER_DIR.
const ALLOWLIST = new Set(['page.tsx'])

const BREADCRUMBS_IMPORT =
  /import\s*\{[^}]*\bBreadcrumbs\b[^}]*\}\s*from\s*'@\/components\/Breadcrumbs\/Breadcrumbs'/

function findPageFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return findPageFiles(full)
    return entry.name === 'page.tsx' ? [full] : []
  })
}

const pageFiles = findPageFiles(CENTER_DIR).map((file) => path.relative(CENTER_DIR, file))

describe('breadcrumbs route coverage', () => {
  it('finds the center pages', () => {
    expect(pageFiles.length).toBeGreaterThan(1)
  })

  it('every allowlisted page still exists', () => {
    for (const allowed of ALLOWLIST) {
      expect(pageFiles).toContain(allowed)
    }
  })

  it.each(pageFiles.filter((file) => !ALLOWLIST.has(file)))(
    '%s imports the Breadcrumbs component',
    (file) => {
      const source = readFileSync(path.join(CENTER_DIR, file), 'utf8')
      expect(source).toMatch(BREADCRUMBS_IMPORT)
    },
  )
})
