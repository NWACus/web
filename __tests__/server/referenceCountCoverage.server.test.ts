import { readdirSync, readFileSync } from 'fs'
import path from 'path'

/**
 * `referenceCount` lives on the Shared Content document but is only ever changed from the other
 * side, by a hook on whichever collection recorded the reference. That makes every collection
 * carrying `documentReferencesField()` responsible for registering the sync hooks, and a new one
 * that forgets would silently leave counts frozen.
 *
 * This reads the collection configs from disk, so it catches a missing registration but not a hook
 * registered in the wrong array.
 */

const COLLECTIONS_DIR = path.join(process.cwd(), 'src/collections')

const REFERENCES_FIELD = /\bdocumentReferencesField\(\)/
const SYNC_ON_CHANGE = /afterChange:\s*\[[^\]]*\bsyncReferenceCounts\b/s
const SYNC_ON_DELETE = /afterDelete:\s*\[[^\]]*\bsyncReferenceCountsOnDelete\b/s
const REFERENCE_COUNT_FIELD = /\breferenceCountField\(\)/

function findCollectionConfigs(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return findCollectionConfigs(full)
    return /^index\.tsx?$/.test(entry.name) ? [full] : []
  })
}

const configs = findCollectionConfigs(COLLECTIONS_DIR).map((file) => ({
  name: path.relative(COLLECTIONS_DIR, file),
  source: readFileSync(file, 'utf8'),
}))

describe('reference count coverage', () => {
  it('finds the collection configs', () => {
    expect(configs.length).toBeGreaterThan(20)
  })

  const referencing = configs.filter((c) => REFERENCES_FIELD.test(c.source))

  it('finds the collections that record references', () => {
    expect(referencing.length).toBeGreaterThan(0)
  })

  it.each(referencing.map((c) => [c.name, c.source]))(
    '%s recounts on change, because it records references',
    (_name, source) => {
      expect(SYNC_ON_CHANGE.test(source)).toBe(true)
    },
  )

  it.each(referencing.map((c) => [c.name, c.source]))(
    '%s recounts on delete, because it records references',
    (_name, source) => {
      expect(SYNC_ON_DELETE.test(source)).toBe(true)
    },
  )

  it('only collections listed in REFERENCE_COUNTED_COLLECTIONS carry the field', async () => {
    const { REFERENCE_COUNTED_COLLECTIONS } = await import('@/constants/sharedContent')
    const withField = configs
      .filter((c) => REFERENCE_COUNT_FIELD.test(c.source))
      .map((c) => path.dirname(c.name))

    expect(withField).toHaveLength(REFERENCE_COUNTED_COLLECTIONS.length)
  })
})
