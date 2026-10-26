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

// The block's upload field holds a bare ID, or a populated document if saved at depth.
function documentID(value: unknown): string {
  return String(isRecord(value) ? value.id : value)
}

// Sets displayAs on every Document block in a Lexical tree that has none: 'embed' for PDFs, which
// is how they rendered before this migration, 'download' for anything validateDisplayAs would
// reject. Returns whether any block changed.
function backfillDocumentBlocks(node: unknown, pdfIDs: ReadonlySet<string>): boolean {
  if (Array.isArray(node)) {
    return node.map((child) => backfillDocumentBlocks(child, pdfIDs)).some(Boolean)
  }
  if (!isRecord(node)) return false

  let changed = false
  const { fields } = node
  if (node.type === 'block' && isRecord(fields) && fields.blockType === 'documentBlock') {
    if (fields.displayAs === undefined || fields.displayAs === null) {
      fields.displayAs = pdfIDs.has(documentID(fields.document)) ? 'embed' : 'download'
      changed = true
    }
  }
  return backfillDocumentBlocks(Object.values(node), pdfIDs) || changed
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

  // Every Document block that predates this migration rendered as an iframe. Keep PDFs that way;
  // other types stay on the 'download' default, since validateDisplayAs only allows embedding PDFs.
  const pdfDocuments = sql`SELECT \`id\` FROM \`documents\` WHERE \`mime_type\` = 'application/pdf'`
  for (const table of [
    'home_pages_blocks_document_block',
    '_home_pages_v_blocks_document_block',
    'pages_blocks_document_block',
    '_pages_v_blocks_document_block',
  ]) {
    await db.run(
      sql`UPDATE ${sql.identifier(table)} SET \`display_as\` = 'embed' WHERE \`document_id\` IN (${pdfDocuments});`,
    )
  }

  const pdfIDs = new Set(
    (await db.all<{ id: number }>(pdfDocuments)).map((document) => String(document.id)),
  )

  for (const [table, column] of RICH_TEXT_COLUMNS) {
    // Cheap pre-filter: only rows whose JSON mentions the block at all.
    const rows = await db.all<{ id: string | number; json: string }>(
      sql`SELECT id, ${sql.identifier(column)} AS json FROM ${sql.identifier(table)} WHERE ${sql.identifier(column)} LIKE '%documentBlock%'`,
    )
    let updated = 0
    for (const row of rows) {
      const tree: unknown = JSON.parse(row.json)
      if (!backfillDocumentBlocks(tree, pdfIDs)) continue
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
