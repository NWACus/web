import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

// Lexical columns whose editors offer the Document block. Blocks in rich text are stored as
// JSON, so the new column's backfill below can't reach them.
const RICH_TEXT_COLUMNS = [
  ['pages_blocks_content_columns', 'rich_text'],
  ['_pages_v_blocks_content_columns', 'rich_text'],
  ['home_pages_blocks_content_columns', 'rich_text'],
  ['_home_pages_v_blocks_content_columns', 'rich_text'],
  ['home_pages_highlighted_content_columns', 'rich_text'],
  ['_home_pages_v_version_highlighted_content_columns', 'rich_text'],
  ['posts', 'content'],
  ['_posts_v', 'version_content'],
  ['events', 'content'],
  ['_events_v', 'version_content'],
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Sets displayAs: 'embed' on every Document block in a Lexical tree; returns whether any changed.
function embedDocumentBlocks(node: unknown): boolean {
  if (Array.isArray(node)) {
    return node.map(embedDocumentBlocks).some(Boolean)
  }
  if (!isRecord(node)) return false

  let changed = false
  const { fields } = node
  if (node.type === 'block' && isRecord(fields) && fields.blockType === 'documentBlock') {
    if (fields.displayAs === undefined || fields.displayAs === null) {
      fields.displayAs = 'embed'
      changed = true
    }
  }
  return embedDocumentBlocks(Object.values(node)) || changed
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_document_block\` ADD \`display_as\` text DEFAULT 'download';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_document_block\` ADD \`display_as\` text DEFAULT 'download';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_document_block\` ADD \`display_as\` text DEFAULT 'download';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_document_block\` ADD \`display_as\` text DEFAULT 'download';`,
  )

  // Every Document block that predates this migration rendered as an iframe; keep it that way.
  await db.run(sql`UPDATE \`home_pages_blocks_document_block\` SET \`display_as\` = 'embed';`)
  await db.run(sql`UPDATE \`_home_pages_v_blocks_document_block\` SET \`display_as\` = 'embed';`)
  await db.run(sql`UPDATE \`pages_blocks_document_block\` SET \`display_as\` = 'embed';`)
  await db.run(sql`UPDATE \`_pages_v_blocks_document_block\` SET \`display_as\` = 'embed';`)

  for (const [table, column] of RICH_TEXT_COLUMNS) {
    // Cheap pre-filter: only rows whose JSON mentions the block at all.
    const rows = await db.all<{ id: string | number; json: string }>(
      sql`SELECT id, ${sql.identifier(column)} AS json FROM ${sql.identifier(table)} WHERE ${sql.identifier(column)} LIKE '%documentBlock%'`,
    )
    let updated = 0
    for (const row of rows) {
      const tree: unknown = JSON.parse(row.json)
      if (!embedDocumentBlocks(tree)) continue
      updated++
      await db.run(
        sql`UPDATE ${sql.identifier(table)} SET ${sql.identifier(column)} = ${JSON.stringify(tree)} WHERE id = ${row.id}`,
      )
    }
    if (updated > 0) {
      payload.logger.info({ table, updated }, 'Backfilled rich-text Document blocks')
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // The displayAs keys added to rich-text JSON are left in place; Payload ignores unknown block fields.
  await db.run(sql`ALTER TABLE \`home_pages_blocks_document_block\` DROP COLUMN \`display_as\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_document_block\` DROP COLUMN \`display_as\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_document_block\` DROP COLUMN \`display_as\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_document_block\` DROP COLUMN \`display_as\`;`)
}
