/**
 * Diffs the database across `pnpm migrate` to catch migrations that touch existing data.
 *
 *   pnpm db:diff before <dir>   snapshot, if any migrations are pending
 *   pnpm db:diff after <dir>    snapshot again, diff, write report.md / report.json
 *
 * Warn-only: it never fails the job. See docs/migration-safety.md.
 */
import { createClient } from '@libsql/client'
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { diffSnapshots } from './diffSnapshots'
import { findingsFor, formatReport } from './formatReport'
import { findPendingMigrations, takeSnapshot } from './snapshot'
import type { DbSnapshot } from './types'

const MIGRATION_DIR = path.resolve(process.cwd(), 'src/migrations')

function connect() {
  const url = process.env.DATABASE_URI
  if (!url) throw new Error('DATABASE_URI is not set')
  return createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN })
}

async function timed<T>(label: string, run: () => Promise<T>): Promise<T> {
  const start = Date.now()
  const result = await run()
  console.log(`${label} in ${((Date.now() - start) / 1000).toFixed(1)}s`)
  return result
}

async function before(dir: string) {
  const client = connect()
  const pending = await findPendingMigrations(client, MIGRATION_DIR)
  if (!pending.length) {
    console.log('No pending migrations; skipping the database diff.')
    return
  }
  console.log(`Pending migrations: ${pending.join(', ')}`)
  const snapshot = await timed('Snapshot taken', () => takeSnapshot(client, pending))
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'before.json'), JSON.stringify(snapshot))
}

function readSnapshot(file: string): DbSnapshot {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

async function after(dir: string) {
  const beforeFile = path.join(dir, 'before.json')
  if (!fs.existsSync(beforeFile)) {
    console.log('No "before" snapshot; skipping the database diff.')
    return
  }
  const snapshot = await timed('Snapshot taken', () => takeSnapshot(connect(), []))
  const report = diffSnapshots(readSnapshot(beforeFile), snapshot)
  const markdown = formatReport(report)
  fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report, null, 2))
  fs.writeFileSync(path.join(dir, 'report.md'), markdown)
  console.log(markdown)
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown)
  for (const finding of findingsFor(report))
    console.log(`::warning title=Database diff::${finding}`)
}

const commands: Record<string, (dir: string) => Promise<void>> = { before, after }

async function main() {
  const [command, dir] = process.argv.slice(2)
  const run = commands[command]
  if (!run || !dir) {
    throw new Error('Usage: pnpm db:diff <before|after> <dir>')
  }
  await run(dir)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
