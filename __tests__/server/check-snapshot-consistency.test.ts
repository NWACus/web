import {
  detectRegressions,
  type MigrationSnapshot,
  type TableSchema,
} from '@/scripts/check-snapshot-consistency'

function makeSnapshot(tables: Record<string, { columns: string[] }>): MigrationSnapshot {
  const snapshotTables: Record<string, TableSchema> = {}
  for (const [name, { columns }] of Object.entries(tables)) {
    const columnRecord: Record<string, unknown> = {}
    for (const col of columns) {
      columnRecord[col] = { name: col, type: 'text', primaryKey: false, notNull: false }
    }
    snapshotTables[name] = { name, columns: columnRecord }
  }
  return { version: '6', dialect: 'sqlite', tables: snapshotTables }
}

describe('check-snapshot-consistency: detectRegressions', () => {
  it('returns empty array when snapshots progress cleanly', () => {
    const a = makeSnapshot({ users: { columns: ['id', 'name'] } })
    const b = makeSnapshot({ users: { columns: ['id', 'name', 'email'] } })
    const c = makeSnapshot({ users: { columns: ['id', 'name', 'email', 'phone'] } })

    expect(detectRegressions(a, b, c)).toEqual([])
  })

  it('detects column added in B then missing from C', () => {
    const a = makeSnapshot({ users: { columns: ['id', 'name'] } })
    // B adds 'email'
    const b = makeSnapshot({ users: { columns: ['id', 'name', 'email'] } })
    // C is missing 'email' (stale snapshot)
    const c = makeSnapshot({ users: { columns: ['id', 'name'] } })

    const regressions = detectRegressions(a, b, c)
    expect(regressions).toHaveLength(1)
    expect(regressions[0]).toMatchObject({
      table: 'users',
      column: 'email',
      type: 'column_added_then_missing',
    })
  })

  it('detects column removed in B then reappearing in C', () => {
    const a = makeSnapshot({ users: { columns: ['id', 'name', 'legacy_field'] } })
    // B removes 'legacy_field'
    const b = makeSnapshot({ users: { columns: ['id', 'name'] } })
    // C has 'legacy_field' again (stale snapshot)
    const c = makeSnapshot({ users: { columns: ['id', 'name', 'legacy_field'] } })

    const regressions = detectRegressions(a, b, c)
    expect(regressions).toHaveLength(1)
    expect(regressions[0]).toMatchObject({
      table: 'users',
      column: 'legacy_field',
      type: 'column_removed_then_reappears',
    })
  })

  it('detects column rename regression (add + remove)', () => {
    // This is the button_appearance → button_variant scenario
    const a = makeSnapshot({ cards: { columns: ['id', 'button_appearance'] } })
    // B renames: removes button_appearance, adds button_variant
    const b = makeSnapshot({ cards: { columns: ['id', 'button_variant'] } })
    // C has old name (stale snapshot)
    const c = makeSnapshot({ cards: { columns: ['id', 'button_appearance'] } })

    const regressions = detectRegressions(a, b, c)
    expect(regressions).toHaveLength(2)

    const types = regressions.map((r) => r.type).sort()
    expect(types).toEqual(['column_added_then_missing', 'column_removed_then_reappears'])

    const addedThenMissing = regressions.find((r) => r.type === 'column_added_then_missing')
    expect(addedThenMissing?.column).toBe('button_variant')

    const removedThenReappears = regressions.find((r) => r.type === 'column_removed_then_reappears')
    expect(removedThenReappears?.column).toBe('button_appearance')
  })

  it('detects table added in B then missing from C', () => {
    const a = makeSnapshot({ users: { columns: ['id'] } })
    // B adds 'posts' table
    const b = makeSnapshot({
      users: { columns: ['id'] },
      posts: { columns: ['id', 'title'] },
    })
    // C is missing 'posts' table
    const c = makeSnapshot({ users: { columns: ['id'] } })

    const regressions = detectRegressions(a, b, c)
    expect(regressions).toHaveLength(1)
    expect(regressions[0]).toMatchObject({
      table: 'posts',
      type: 'table_added_then_missing',
    })
  })

  it('detects table removed in B then reappearing in C', () => {
    const a = makeSnapshot({
      users: { columns: ['id'] },
      legacy: { columns: ['id', 'data'] },
    })
    // B removes 'legacy' table
    const b = makeSnapshot({ users: { columns: ['id'] } })
    // C has 'legacy' table again
    const c = makeSnapshot({
      users: { columns: ['id'] },
      legacy: { columns: ['id', 'data'] },
    })

    const regressions = detectRegressions(a, b, c)
    expect(regressions).toHaveLength(1)
    expect(regressions[0]).toMatchObject({
      table: 'legacy',
      type: 'table_removed_then_reappears',
    })
  })

  it('detects column missing from newly added table in C', () => {
    const a = makeSnapshot({ users: { columns: ['id'] } })
    // B adds 'posts' table with title and body
    const b = makeSnapshot({
      users: { columns: ['id'] },
      posts: { columns: ['id', 'title', 'body'] },
    })
    // C has 'posts' but is missing 'body' column
    const c = makeSnapshot({
      users: { columns: ['id'] },
      posts: { columns: ['id', 'title'] },
    })

    const regressions = detectRegressions(a, b, c)
    expect(regressions).toHaveLength(1)
    expect(regressions[0]).toMatchObject({
      table: 'posts',
      column: 'body',
      type: 'column_added_then_missing',
    })
  })

  it('returns empty array when no changes between snapshots', () => {
    const snapshot = makeSnapshot({ users: { columns: ['id', 'name'] } })
    expect(detectRegressions(snapshot, snapshot, snapshot)).toEqual([])
  })

  it('handles multiple tables with regressions', () => {
    const a = makeSnapshot({
      users: { columns: ['id', 'name'] },
      posts: { columns: ['id', 'old_field'] },
    })
    const b = makeSnapshot({
      users: { columns: ['id', 'name', 'email'] },
      posts: { columns: ['id', 'new_field'] },
    })
    // C reverts both changes
    const c = makeSnapshot({
      users: { columns: ['id', 'name'] },
      posts: { columns: ['id', 'old_field'] },
    })

    const regressions = detectRegressions(a, b, c)
    // users: email added then missing
    // posts: new_field added then missing, old_field removed then reappears
    expect(regressions).toHaveLength(3)
  })
})
