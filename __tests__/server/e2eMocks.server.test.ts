import { afpApiHost, nacApiHost } from '@/services/nac/hosts'
import { forecastResultSchema, warningResultSchema } from '@/services/nac/types/forecastSchemas'
import { productListSchema } from '@/services/nac/types/productListSchemas'
import {
  allAvalancheCenterCapabilitiesSchema,
  avalancheCenterSchema,
  mapLayerSchema,
} from '@/services/nac/types/schemas'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * Guards the E2E upstream mocks from the two ways they could quietly stop meaning anything: a
 * "golden" edited by hand into saying what a test wants, and a fixture that no longer satisfies
 * the wire schema the app parses it with. Both would surface at E2E time as a page degrading to
 * "Unable to load forecast data", which is easy to misread as a product bug.
 */
const mocksDir = resolve(__dirname, '../e2e/mocks')
const goldenDir = join(mocksDir, 'afp-golden')
const provisionalDir = join(mocksDir, 'provisional')

type Manifest = { source: { commit: string }; files: { name: string; sha256: string }[] }

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function isManifest(value: unknown): value is Manifest {
  if (!value || typeof value !== 'object' || !('files' in value)) return false
  return Array.isArray(value.files)
}

function fixturePath(name: string): string {
  const vendored = join(goldenDir, name)
  return existsSync(vendored) ? vendored : join(provisionalDir, name)
}

const scenarios = readJson(join(mocksDir, 'scenarios.json'))

function assertScenarios(value: unknown): asserts value is {
  capabilities: { fixture: string }
  centers: Record<string, { metadata?: string; mapLayer?: string | null; archive?: string | null }>
  products: {
    center: string
    zone: number
    type: string
    fixture?: string
    phase?: Record<string, string>
  }[]
  productsById: Record<string, string>
  absent: { match: string; fixture?: string; status?: number }[]
  tenants: Record<string, { forecast: boolean; warning: boolean; dangerMap: boolean }>
} {
  if (!value || typeof value !== 'object') throw new Error('scenarios.json is not an object')
}

assertScenarios(scenarios)

describe('E2E golden corpus', () => {
  it('matches its recorded provenance', () => {
    const manifest = readJson(join(goldenDir, 'PROVENANCE.json'))
    if (!isManifest(manifest)) throw new Error('PROVENANCE.json has no files list')

    for (const file of manifest.files) {
      const actual = createHash('sha256')
        .update(readFileSync(join(goldenDir, file.name)))
        .digest('hex')
      expect({ name: file.name, sha256: actual }).toEqual({ name: file.name, sha256: file.sha256 })
    }

    const onDisk = readdirSync(goldenDir).filter((name) => name !== 'PROVENANCE.json')
    expect(onDisk.sort()).toEqual(manifest.files.map((file) => file.name).sort())
  })

  it('has every fixture the scenario table refers to', () => {
    const referenced = [
      scenarios.capabilities.fixture,
      ...Object.values(scenarios.centers).flatMap((c) => [c.metadata, c.mapLayer, c.archive]),
      ...scenarios.products.flatMap((p) => [p.fixture, ...Object.values(p.phase ?? {})]),
      ...Object.values(scenarios.productsById),
      ...scenarios.absent.map((entry) => entry.fixture),
    ].filter((name) => typeof name === 'string')

    for (const name of new Set(referenced)) {
      expect({ name, exists: existsSync(fixturePath(name)) }).toEqual({ name, exists: true })
    }
  })
})

describe('E2E fixtures against the wire schemas', () => {
  it('parses every center metadata fixture', () => {
    for (const [centerId, center] of Object.entries(scenarios.centers)) {
      if (!center.metadata) continue
      const parsed = avalancheCenterSchema.safeParse(readJson(fixturePath(center.metadata)))
      expect({ centerId, ok: parsed.success }).toEqual({ centerId, ok: true })
    }
  })

  it('parses the capability feed', () => {
    const parsed = allAvalancheCenterCapabilitiesSchema.safeParse(
      readJson(fixturePath(scenarios.capabilities.fixture)),
    )
    expect(parsed.success).toBe(true)
  })

  it('parses every product fixture with the schema its request would use', () => {
    const names = new Set<string>()
    for (const product of scenarios.products) {
      const schema = product.type === 'warning' ? warningResultSchema : forecastResultSchema
      const fixtures = product.phase ? Object.values(product.phase) : [product.fixture]
      for (const name of fixtures) {
        if (!name || names.has(`${product.type}:${name}`)) continue
        names.add(`${product.type}:${name}`)
        const parsed = schema.safeParse(readJson(fixturePath(name)))
        expect({ name, ok: parsed.success }).toEqual({ name, ok: true })
      }
    }
    // The by-id route serves the same product envelope.
    for (const name of Object.values(scenarios.productsById)) {
      const parsed = forecastResultSchema.safeParse(readJson(fixturePath(name)))
      expect({ name, ok: parsed.success }).toEqual({ name, ok: true })
    }
  })

  it('parses the map-layer and archive fixtures', () => {
    for (const center of Object.values(scenarios.centers)) {
      if (center.mapLayer) {
        expect(mapLayerSchema.safeParse(readJson(fixturePath(center.mapLayer))).success).toBe(true)
      }
      if (center.archive) {
        expect(productListSchema.safeParse(readJson(fixturePath(center.archive))).success).toBe(
          true,
        )
      }
    }
  })
})

describe('E2E mock wiring', () => {
  it('resolves the same upstream hosts the app does', async () => {
    const handlers: { mockNacHost: string; mockAfpHost: string } = await import(
      '../e2e/mocks/handlers.mjs'
    )
    expect(handlers.mockNacHost).toBe(nacApiHost)
    expect(handlers.mockAfpHost).toBe(afpApiHost)
  })

  it('declares the same rollout flags the seed writes', async () => {
    // Both halves must agree or a spec asserts the native page against a widget-mode tenant.
    const seed = readFileSync(resolve(__dirname, '../../src/endpoints/seed/index.ts'), 'utf8')
    for (const [slug, flags] of Object.entries(scenarios.tenants)) {
      if (!flags.forecast && !flags.warning && !flags.dangerMap) continue
      const declared = `${slug}: { forecast: ${flags.forecast}, warning: ${flags.warning}, dangerMap: ${flags.dangerMap} }`
      expect({ slug, inSeed: seed.includes(declared) }).toEqual({ slug, inSeed: true })
    }
  })

  it('does not declare a URL both mapped and absent', () => {
    const mappedIds = Object.keys(scenarios.productsById)
    for (const entry of scenarios.absent) {
      for (const id of mappedIds) {
        expect(entry.match).not.toBe(`product/${id}`)
      }
    }
  })
})
