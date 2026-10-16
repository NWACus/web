import { diffSnapshots, isReinsertedOnUpdate } from '@/scripts/db-diff/diffSnapshots'
import { findingsFor, formatReport } from '@/scripts/db-diff/formatReport'
import type { ColumnInfo, DbSnapshot, TableSnapshot } from '@/scripts/db-diff/types'

function column(name: string, type = 'text'): ColumnInfo {
  return { name, type, notNull: false, defaultValue: null, primaryKey: name === 'id' ? 1 : 0 }
}

function table(columnNames: string[], rows: Record<string, string[]>): TableSnapshot {
  return {
    columns: columnNames.map((name) => column(name)),
    constraints: [],
    rowCount: Object.keys(rows).length,
    rows,
  }
}

function snapshot(overrides: Partial<DbSnapshot> = {}): DbSnapshot {
  return {
    takenAt: '2026-10-07T00:00:00.000Z',
    pendingMigrations: [],
    tables: {},
    schemaObjects: [],
    foreignKeyViolations: {},
    errors: [],
    ...overrides,
  }
}

const pages = table(['id', 'title', 'updated_at'], {
  1: ['h-1', 'h-title-1', 'h-t0'],
  2: ['h-2', 'h-title-2', 'h-t0'],
})

describe('diffSnapshots', () => {
  it('reports nothing when the snapshots match', () => {
    const report = diffSnapshots(snapshot({ tables: { pages } }), snapshot({ tables: { pages } }))

    expect(report.tables).toEqual([])
    expect(findingsFor(report)).toEqual([])
  })

  it('lists the migrations that were pending before the run', () => {
    const report = diffSnapshots(snapshot({ pendingMigrations: ['20261007_a'] }), snapshot())

    expect(report.migrations).toEqual(['20261007_a'])
  })

  it('reports appended rows without raising a finding', () => {
    const after = table(['id', 'title', 'updated_at'], {
      ...pages.rows,
      3: ['h-3', 'h-title-3', 'h-t1'],
    })

    const report = diffSnapshots(
      snapshot({ tables: { pages } }),
      snapshot({ tables: { pages: after } }),
    )

    expect(report.tables).toEqual([
      expect.objectContaining({ table: 'pages', rowsBefore: 2, rowsAfter: 3, addedIds: ['3'] }),
    ])
    expect(findingsFor(report)).toEqual([])
  })

  it('flags rows lost from a _rels table', () => {
    const before = table(['id', 'parent_id'], { 1: ['a', 'p'], 2: ['b', 'p'], 10: ['c', 'p'] })
    const after = table(['id', 'parent_id'], { 1: ['a', 'p'] })

    const report = diffSnapshots(
      snapshot({ tables: { pages_rels: before } }),
      snapshot({ tables: { pages_rels: after } }),
    )

    expect(report.tables[0].deletedIds).toEqual(['2', '10'])
    expect(findingsFor(report)).toEqual(['`pages_rels`: 2 rows deleted'])
  })

  it('flags existing rows whose values changed, counted per column', () => {
    const after = table(['id', 'title', 'updated_at'], {
      1: ['h-1', 'h-title-1', 'h-t1'],
      2: ['h-2', 'h-title-2b', 'h-t1'],
    })

    const report = diffSnapshots(
      snapshot({ tables: { pages } }),
      snapshot({ tables: { pages: after } }),
    )

    expect(report.tables[0]).toMatchObject({
      changedIds: ['1', '2'],
      changedColumns: { updated_at: 2, title: 1 },
    })
    expect(findingsFor(report)).toEqual([
      '`pages`: 2 existing rows changed (updated_at ×2, title ×1)',
    ])
  })

  it('compares rows on shared columns only when a column is added', () => {
    const after: TableSnapshot = {
      columns: [...pages.columns, column('glossary_enabled', 'integer')],
      constraints: [],
      rowCount: 2,
      rows: {
        1: ['h-1', 'h-title-1', 'h-t0', 'h-null'],
        2: ['h-2', 'h-title-2', 'h-t0', 'h-null'],
      },
    }

    const report = diffSnapshots(
      snapshot({ tables: { pages } }),
      snapshot({ tables: { pages: after } }),
    )

    expect(report.tables[0]).toMatchObject({ addedColumns: ['glossary_enabled'], changedIds: [] })
    expect(findingsFor(report)).toEqual([])
  })

  it('matches columns by name, not position', () => {
    const reordered = table(['updated_at', 'id', 'title'], {
      1: ['h-t0', 'h-1', 'h-title-1'],
      2: ['h-t0', 'h-2', 'h-title-2'],
    })

    const report = diffSnapshots(
      snapshot({ tables: { pages } }),
      snapshot({ tables: { pages: reordered } }),
    )

    expect(report.tables).toEqual([])
  })

  it('flags dropped and altered columns', () => {
    const after: TableSnapshot = {
      columns: [column('id'), { ...column('title'), type: 'integer', notNull: true }],
      constraints: [],
      rowCount: 2,
      rows: { 1: ['h-1', 'h-title-1'], 2: ['h-2', 'h-title-2'] },
    }

    const report = diffSnapshots(
      snapshot({ tables: { pages } }),
      snapshot({ tables: { pages: after } }),
    )

    expect(report.tables[0]).toMatchObject({
      droppedColumns: ['updated_at'],
      alteredColumns: ['title: text → integer NOT NULL'],
    })
    expect(findingsFor(report)).toEqual([
      '`pages`: column `updated_at` dropped',
      '`pages`: column altered (title: text → integer NOT NULL)',
    ])
  })

  it('reports added and dropped tables with their row counts', () => {
    const glossary = table(['id'], { 1: ['h-1'] })

    const report = diffSnapshots(
      snapshot({ tables: { pages } }),
      snapshot({ tables: { glossary_terms: glossary } }),
    )

    expect(report.addedTables).toEqual([{ table: 'glossary_terms', rows: 1 }])
    expect(report.droppedTables).toEqual([{ table: 'pages', rows: 2 }])
    expect(findingsFor(report)).toEqual(['`pages`: table dropped (2 rows)'])
  })

  it('compares only row counts for volatile tables', () => {
    const before: TableSnapshot = { columns: [column('id')], constraints: [], rowCount: 4 }
    const after: TableSnapshot = { columns: [column('id')], constraints: [], rowCount: 5 }

    const report = diffSnapshots(
      snapshot({ tables: { users_sessions: before } }),
      snapshot({ tables: { users_sessions: after } }),
    )

    expect(report.tables).toEqual([
      expect.objectContaining({
        table: 'users_sessions',
        rowsBefore: 4,
        rowsAfter: 5,
        deletedIds: [],
      }),
    ])
    expect(findingsFor(report)).toEqual([])
  })

  it('reports added, dropped and altered indexes', () => {
    const before = snapshot({
      schemaObjects: [
        {
          type: 'index',
          name: 'pages_slug_idx',
          sql: 'CREATE INDEX pages_slug_idx ON pages (slug)',
        },
        {
          type: 'index',
          name: 'pages_tenant_idx',
          sql: 'CREATE INDEX pages_tenant_idx ON pages (tenant_id)',
        },
      ],
    })
    const after = snapshot({
      schemaObjects: [
        {
          type: 'index',
          name: 'pages_slug_idx',
          sql: 'CREATE UNIQUE INDEX pages_slug_idx ON pages (slug)',
        },
        {
          type: 'index',
          name: 'glossary_idx',
          sql: 'CREATE INDEX glossary_idx ON glossary_terms (id)',
        },
      ],
    })

    const report = diffSnapshots(before, after)

    expect(report.addedObjects).toEqual(['index `glossary_idx`'])
    expect(report.droppedObjects).toEqual(['index `pages_tenant_idx`'])
    expect(report.alteredObjects).toEqual(['index `pages_slug_idx`'])
    expect(findingsFor(report)).toEqual([
      'index `pages_tenant_idx` dropped',
      'index `pages_slug_idx` definition changed',
    ])
  })

  it('flags only foreign key violations that grew during the run', () => {
    const report = diffSnapshots(
      snapshot({ foreignKeyViolations: { 'pages_rels → posts': 3 } }),
      snapshot({ foreignKeyViolations: { 'pages_rels → posts': 3, 'posts_rels → media': 2 } }),
    )

    expect(report.newForeignKeyViolations).toEqual(['posts_rels → media (+2)'])
    expect(findingsFor(report)).toEqual(['foreign key violations: posts_rels → media (+2)'])
  })

  describe('tables Payload re-inserts on update', () => {
    const relsColumns = [column('id', 'integer'), column('parent_id', 'integer'), column('tags_id')]
    const rels = (rows: Record<string, string[]>): TableSnapshot => ({
      columns: relsColumns,
      constraints: [],
      rowCount: Object.keys(rows).length,
      rows,
    })

    it('treats rows re-inserted with fresh ids as unchanged', () => {
      const before = rels({ 1: ['h-1', 'h-post-1', 'h-tag-a'], 2: ['h-2', 'h-post-1', 'h-tag-b'] })
      const after = rels({ 7: ['h-7', 'h-post-1', 'h-tag-a'], 8: ['h-8', 'h-post-1', 'h-tag-b'] })

      const report = diffSnapshots(
        snapshot({ tables: { posts_rels: before } }),
        snapshot({ tables: { posts_rels: after } }),
      )

      expect(report.tables).toEqual([])
    })

    it('still flags relationships that disappeared', () => {
      const before = rels({ 1: ['h-1', 'h-post-1', 'h-tag-a'], 2: ['h-2', 'h-post-1', 'h-tag-a'] })
      const after = rels({ 7: ['h-7', 'h-post-1', 'h-tag-a'] })

      const report = diffSnapshots(
        snapshot({ tables: { posts_rels: before } }),
        snapshot({ tables: { posts_rels: after } }),
      )

      expect(findingsFor(report)).toEqual(['`posts_rels`: 1 row deleted'])
    })

    it('keys array tables with text ids by id', () => {
      expect(isReinsertedOnUpdate([column('id', 'text'), column('_parent_id', 'integer')])).toBe(
        false,
      )
      expect(isReinsertedOnUpdate([column('id', 'INTEGER'), column('_parent_id', 'integer')])).toBe(
        true,
      )
      expect(isReinsertedOnUpdate([column('id', 'integer'), column('title')])).toBe(false)
    })
  })

  it('flags a row count drop in a volatile table', () => {
    const before: TableSnapshot = { columns: [column('id')], constraints: [], rowCount: 5 }
    const after: TableSnapshot = { columns: [column('id')], constraints: [], rowCount: 0 }

    const report = diffSnapshots(
      snapshot({ tables: { users_sessions: before } }),
      snapshot({ tables: { users_sessions: after } }),
    )

    expect(findingsFor(report)).toEqual([
      '`users_sessions`: row count dropped by 5 (count-only table)',
    ])
  })

  it('flags a foreign key whose ON DELETE action changed', () => {
    const fk = (onDelete: string) =>
      `FOREIGN KEY (tags_id) → tags(id) ON UPDATE NO ACTION ON DELETE ${onDelete}`
    const before = { ...table(['id'], {}), constraints: [fk('CASCADE')] }
    const after = { ...table(['id'], {}), constraints: [fk('NO ACTION')] }

    const report = diffSnapshots(
      snapshot({ tables: { posts_rels: before } }),
      snapshot({ tables: { posts_rels: after } }),
    )

    expect(report.tables[0].addedConstraints).toEqual([fk('NO ACTION')])
    expect(findingsFor(report)).toEqual([
      `\`posts_rels\`: constraint dropped or changed (${fk('CASCADE')})`,
    ])
  })

  it('reports unreadable tables instead of comparing them', () => {
    const error = { target: 'pages', code: 'RESPONSE_TOO_LARGE', message: 'Response is too large' }

    const report = diffSnapshots(
      snapshot({ tables: { pages } }),
      snapshot({ errors: [error], foreignKeyViolations: null }),
    )

    expect(report.droppedTables).toEqual([])
    expect(report.newForeignKeyViolations).toEqual([])
    expect(findingsFor(report)).toEqual([
      "`pages`: couldn't be read in the after snapshot (RESPONSE_TOO_LARGE), so it wasn't compared",
    ])
  })
})

describe('formatReport', () => {
  it('says so when no existing data or schema was touched', () => {
    const after = table(['id', 'title', 'updated_at'], {
      ...pages.rows,
      3: ['h-3', 'h-title-3', 'h-t1'],
    })
    const report = diffSnapshots(
      snapshot({ pendingMigrations: ['20261007_add_pages'], tables: { pages } }),
      snapshot({ tables: { pages: after } }),
    )

    const markdown = formatReport(report, { detailed: true })

    expect(markdown).toContain('`20261007_add_pages`')
    expect(markdown).toContain(
      'No existing rows, tables, columns, constraints or indexes were removed or changed',
    )
    expect(markdown).toContain('| `pages` | 2 | 3 | +1 | 0 | 0 |')
  })

  it('lists findings with a capped sample of row ids', () => {
    const before = table(
      ['id'],
      Object.fromEntries(Array.from({ length: 15 }, (_, i) => [String(i + 1), [`h-${i + 1}`]])),
    )
    const report = diffSnapshots(
      snapshot({ tables: { pages_rels: before } }),
      snapshot({ tables: { pages_rels: table(['id'], {}) } }),
    )

    const markdown = formatReport(report, { detailed: true })

    expect(markdown).toContain('`pages_rels`: 15 rows deleted')
    expect(markdown).toContain('deleted ids: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 … +5 more')
  })

  it('leaves row ids, table sizes and error messages out of public output', () => {
    const before = table(['id'], { 1: ['h-1'], 2: ['h-2'] })
    const report = diffSnapshots(
      snapshot({ tables: { pages_rels: before, pages } }),
      snapshot({
        tables: { pages_rels: table(['id'], { 1: ['h-1'] }) },
        errors: [{ target: 'pages', code: 'SQLITE_ERROR', message: 'secret detail' }],
      }),
    )

    const markdown = formatReport(report, { detailed: false })

    expect(markdown).toContain('`pages_rels`: 1 row deleted')
    expect(markdown).toContain('| `pages_rels` | +0 | 1 | 0 |')
    expect(markdown).not.toContain('deleted ids')
    expect(markdown).not.toContain('Before')
    expect(markdown).not.toContain('secret detail')
  })
})
