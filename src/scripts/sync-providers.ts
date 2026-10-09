/**
 * Copies published Providers from a source database (e.g. the Turso dev database, which mirrors
 * prod) into the local database, so a Course Import can be tested against the real Provider names
 * and Approved Course Types.
 *
 * Reads the source with plain SELECTs and writes only to a local `file:` database. Providers are
 * matched by name (ignoring case and spacing): existing ones are updated, missing ones created,
 * all published with approval emails and revalidation turned off. Courses are not copied.
 *
 *   SOURCE_DATABASE_URI=libsql://… SOURCE_DATABASE_AUTH_TOKEN=… pnpm sync-providers
 *
 * Optional: DRY_RUN=1 to only print what would change, and SHEET=path/to/sheet.csv to list the
 * sheet's Provider names that don't match any source Provider.
 */

import 'dotenv/config'

import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { getPayload, type Payload } from 'payload'

import config from '../payload.config.js'
import {
  droppedSourceValues,
  matchLocalProviders,
  type ProviderMatch,
  sourceProviders,
  syncLine,
  unmatchedSheetProviders,
} from '../services/courseImport/syncProviders'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required.`)
  return value
}

async function readSource() {
  const source = createClient({
    url: requireEnv('SOURCE_DATABASE_URI'),
    authToken: process.env.SOURCE_DATABASE_AUTH_TOKEN,
  })
  const [providers, courseTypes, statesServiced] = await Promise.all([
    source.execute(
      `SELECT id, name, slug, details, email, phone, website,
              location_address, location_city, location_state, location_zip
       FROM providers WHERE _status = 'published' ORDER BY name`,
    ),
    source.execute('SELECT parent_id, value FROM providers_course_types ORDER BY "order"'),
    source.execute('SELECT parent_id, value FROM providers_states_serviced ORDER BY "order"'),
  ])
  source.close()
  const tables = {
    providers: providers.rows,
    courseTypes: courseTypes.rows,
    statesServiced: statesServiced.rows,
  }
  const dropped = droppedSourceValues(tables)
  if (dropped.length) {
    console.log(`Not copied, because the app doesn't know these values:\n  ${dropped.join('\n  ')}`)
  }
  return sourceProviders(tables)
}

type SourceProviders = Awaited<ReturnType<typeof readSource>>

async function writeProviders(payload: Payload, providers: SourceProviders, dryRun: boolean) {
  const { docs: local } = await payload.find({
    collection: 'providers',
    pagination: false,
    depth: 0,
    draft: true,
    select: { name: true },
  })
  for (const match of matchLocalProviders(providers, local)) {
    console.log(syncLine(match, dryRun))
    if (!dryRun) await saveProvider(payload, match)
  }
}

async function saveProvider(payload: Payload, { data, localId }: ProviderMatch) {
  const context = { disableEmailNotifications: true, disableRevalidate: true }
  if (localId) await payload.update({ collection: 'providers', id: localId, data, context })
  else await payload.create({ collection: 'providers', data, context })
}

function reportSheet(providers: SourceProviders, sheetPath: string) {
  const unmatched = unmatchedSheetProviders(providers, readFileSync(sheetPath, 'utf8'))
  console.log(
    unmatched.length
      ? `Sheet Providers with no published source Provider:\n  ${unmatched.join('\n  ')}`
      : 'Every Provider in the sheet matches a published source Provider.',
  )
}

async function syncProviders() {
  const target = requireEnv('DATABASE_URI')
  if (!target.startsWith('file:')) {
    throw new Error(`Refusing to write Providers to ${target}: only a local file: database.`)
  }
  const payload = await getPayload({ config })
  const providers = await readSource()
  console.log(`Found ${providers.length} published Providers in the source database.`)
  await writeProviders(payload, providers, process.env.DRY_RUN === '1')
  if (process.env.SHEET) reportSheet(providers, process.env.SHEET)
  process.exit(0)
}

syncProviders().catch((error) => {
  console.error(error)
  process.exit(1)
})
