import { findPendingMigrations, takeSnapshot } from '@/scripts/db-diff/snapshot'
import {
  createClient,
  LibsqlError,
  type Client,
  type InArgs,
  type InStatement,
} from '@libsql/client'
import fs from 'fs'
import os from 'os'
import path from 'path'

let dir: string
let client: Client

beforeEach(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'db-diff-'))
  client = createClient({ url: `file:${path.join(dir, 'test.db')}`, intMode: 'bigint' })
  await client.executeMultiple(`
    CREATE TABLE tags (id integer PRIMARY KEY NOT NULL, slug text NOT NULL UNIQUE);
    CREATE TABLE posts_rels (
      id integer PRIMARY KEY NOT NULL,
      parent_id integer NOT NULL,
      tags_id integer REFERENCES tags(id) ON DELETE cascade
    );
    CREATE TABLE users_sessions (id text PRIMARY KEY NOT NULL, _parent_id integer NOT NULL);
    CREATE INDEX posts_rels_tags_idx ON posts_rels (tags_id);
    INSERT INTO tags (id, slug) VALUES (1, 'a'), (2, 'b'), (3, 'c'), (9007199254740993, 'big');
    INSERT INTO posts_rels VALUES (1, 10, 1), (2, 10, 2);
    INSERT INTO users_sessions VALUES ('secret-session-id', 1);
  `)
})

afterEach(() => {
  client.close()
  fs.rmSync(dir, { recursive: true, force: true })
})

/** Wraps the real client, throwing whatever `failure` returns for a statement. */
function failingWhen(failure: (sql: string, args: InArgs | undefined) => Error | undefined) {
  return {
    execute: async (stmt: InStatement | string, args?: InArgs) => {
      const statement = typeof stmt === 'string' ? { sql: stmt, args } : stmt
      const error = failure(statement.sql, statement.args)
      if (error) throw error
      return client.execute(statement)
    },
  }
}

describe('takeSnapshot', () => {
  it('reads every row across pages, keyed by id, without losing large integers', async () => {
    const snapshot = await takeSnapshot(client, [], { pageSize: 2 })

    expect(snapshot.tables.tags.rowCount).toBe(4)
    expect(Object.keys(snapshot.tables.tags.rows ?? {}).sort()).toEqual([
      '1',
      '2',
      '3',
      '9007199254740993',
    ])
    expect(snapshot.errors).toEqual([])
  })

  it('stores only row counts for volatile tables, so session ids never leave the database', async () => {
    const snapshot = await takeSnapshot(client, [])

    expect(snapshot.tables.users_sessions.rowCount).toBe(1)
    expect(snapshot.tables.users_sessions.rows).toBeUndefined()
    expect(JSON.stringify(snapshot)).not.toContain('secret-session-id')
  })

  it('captures foreign keys, unique constraints and named indexes', async () => {
    const snapshot = await takeSnapshot(client, [])

    expect(snapshot.tables.tags.constraints).toEqual(['UNIQUE (slug)'])
    expect(snapshot.tables.posts_rels.constraints).toEqual([
      'FOREIGN KEY (tags_id) → tags(id) ON UPDATE NO ACTION ON DELETE CASCADE',
    ])
    expect(snapshot.schemaObjects).toEqual([
      expect.objectContaining({ type: 'index', name: 'posts_rels_tags_idx' }),
    ])
  })

  it('records a failed foreign key check instead of abandoning the snapshot', async () => {
    // A foreign key to a non-unique column makes PRAGMA foreign_key_check throw "foreign key mismatch".
    await client.execute(
      'CREATE TABLE broken (id integer PRIMARY KEY, ref integer REFERENCES posts_rels(parent_id))',
    )

    const snapshot = await takeSnapshot(client, [])

    expect(snapshot.foreignKeyViolations).toBeNull()
    expect(snapshot.errors).toEqual([
      expect.objectContaining({ target: 'foreign_key_check', code: 'SQLITE_ERROR' }),
    ])
    expect(snapshot.tables.tags.rowCount).toBe(4)
  })

  it('halves the page size when a response is too large', async () => {
    const tooLarge = new LibsqlError('Response is too large', 'RESPONSE_TOO_LARGE')
    const executor = failingWhen((sql, args) =>
      sql.includes('FROM "tags" WHERE rowid') && Array.isArray(args) && Number(args[1]) > 1
        ? tooLarge
        : undefined,
    )

    const snapshot = await takeSnapshot(executor, [], { pageSize: 8 })

    expect(snapshot.tables.tags.rowCount).toBe(4)
    expect(snapshot.errors).toEqual([])
  })

  it('records a table that fails to read and keeps reading the rest', async () => {
    const executor = failingWhen((sql) =>
      sql.includes('FROM "posts_rels" WHERE rowid') ? new Error('boom') : undefined,
    )

    const snapshot = await takeSnapshot(executor, [])

    expect(snapshot.errors).toEqual([{ target: 'posts_rels', code: 'Error', message: 'boom' }])
    expect(snapshot.tables.posts_rels).toBeUndefined()
    expect(snapshot.tables.tags.rowCount).toBe(4)
  })
})

describe('findPendingMigrations', () => {
  let migrationDir: string

  beforeEach(() => {
    migrationDir = path.join(dir, 'migrations')
    fs.mkdirSync(migrationDir)
    for (const file of ['20260101_a.ts', '20260101_a.json', '20260102_b.ts', 'index.ts']) {
      fs.writeFileSync(path.join(migrationDir, file), '')
    }
  })

  it('treats every migration as pending when payload_migrations does not exist', async () => {
    expect(await findPendingMigrations(client, migrationDir)).toEqual(['20260101_a', '20260102_b'])
  })

  it('skips migrations already recorded in payload_migrations', async () => {
    await client.executeMultiple(`
      CREATE TABLE payload_migrations (id integer PRIMARY KEY, name text, batch integer);
      INSERT INTO payload_migrations (name, batch) VALUES ('20260101_a', 1), ('dev', -1);
    `)

    expect(await findPendingMigrations(client, migrationDir)).toEqual(['20260102_b'])
  })
})
