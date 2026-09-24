jest.mock('../../src/payload.config', () => ({}))

import { REFERENCE_COUNTED_COLLECTIONS } from '@/constants/sharedContent'
import { syncReferenceCounts, syncReferenceCountsOnDelete } from '@/hooks/syncReferenceCounts'
import { isRecord } from '@/utilities/isRecord'
import { readdirSync, readFileSync } from 'fs'
import path from 'path'
import type { CollectionConfig } from 'payload'

/**
 * `referenceCount` lives on the Shared Content document but is only ever changed from the other
 * side, by a hook on whichever collection recorded the reference. That makes every collection
 * carrying `documentReferencesField()` responsible for registering the sync hooks, and a new one
 * that forgets would silently leave counts frozen.
 *
 * Candidates are found by scanning source, then each config is imported and its real hook arrays
 * and fields are checked, so a commented-out registration does not pass.
 */

const COLLECTIONS_DIR = path.join(process.cwd(), 'src/collections')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return /\.tsx?$/.test(entry.name) ? [full] : []
  })
}

// The collection directory of every source file that mentions the helper, wherever the fields live
function collectionDirsMentioning(helper: string): string[] {
  const dirs = sourceFiles(COLLECTIONS_DIR)
    .filter((file) => readFileSync(file, 'utf8').includes(`${helper}()`))
    .map((file) => path.relative(COLLECTIONS_DIR, file).split(path.sep)[0])
  return [...new Set(dirs)]
}

const isCollectionConfig = (value: unknown): value is CollectionConfig =>
  isRecord(value) && typeof value.slug === 'string' && Array.isArray(value.fields)

async function loadCollection(dir: string): Promise<CollectionConfig> {
  const mod: Record<string, unknown> = await import(path.join(COLLECTIONS_DIR, dir))
  const config = Object.values(mod).find(isCollectionConfig)
  if (!config) throw new Error(`No collection config exported from src/collections/${dir}`)
  return config
}

const hasTopLevelField = (config: CollectionConfig, name: string) =>
  config.fields.some((field) => 'name' in field && field.name === name)

const referencingDirs = collectionDirsMentioning('documentReferencesField')
const countedDirs = collectionDirsMentioning('referenceCountField')

describe('reference count coverage', () => {
  it('finds the collections that record references', () => {
    expect(referencingDirs.length).toBeGreaterThan(0)
  })

  it.each(referencingDirs)('%s recounts on change and on delete', async (dir) => {
    const config = await loadCollection(dir)
    expect(hasTopLevelField(config, 'documentReferences')).toBe(true)
    expect(config.hooks?.afterChange).toContain(syncReferenceCounts)
    expect(config.hooks?.afterDelete).toContain(syncReferenceCountsOnDelete)
  })

  it('every collection carrying referenceCount is listed in REFERENCE_COUNTED_COLLECTIONS', async () => {
    const slugs = await Promise.all(
      countedDirs.map(async (dir) => {
        const config = await loadCollection(dir)
        expect(hasTopLevelField(config, 'referenceCount')).toBe(true)
        return config.slug
      }),
    )
    expect(slugs.sort()).toEqual([...REFERENCE_COUNTED_COLLECTIONS].sort())
  })
})
