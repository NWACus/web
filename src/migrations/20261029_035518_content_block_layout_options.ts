import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

const CONTENT_BLOCK_TABLES = [
  'home_pages_blocks_content',
  '_home_pages_v_blocks_content',
  'pages_blocks_content',
  '_pages_v_blocks_content',
]

// Stored layout digits used to read opposite to the rendered widths (2_12 rendered 2:1). Swapping
// them keeps every page looking the same while the value now matches its label. The swap is its
// own inverse, so down runs it too.
async function swapReversedLayouts(db: MigrateUpArgs['db']) {
  for (const table of CONTENT_BLOCK_TABLES) {
    await db.run(
      sql.raw(`UPDATE \`${table}\` SET \`layout\` = CASE \`layout\`
        WHEN '2_12' THEN '2_21'
        WHEN '2_21' THEN '2_12'
        WHEN '3_112' THEN '3_211'
        WHEN '3_211' THEN '3_112'
      END
      WHERE \`layout\` IN ('2_12', '2_21', '3_112', '3_211');`),
    )
  }
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_content\` ADD \`vertical_alignment\` text DEFAULT 'top';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_content\` ADD \`vertical_alignment\` text DEFAULT 'top';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_content\` ADD \`vertical_alignment\` text DEFAULT 'top';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_content\` ADD \`vertical_alignment\` text DEFAULT 'top';`,
  )
  await swapReversedLayouts(db)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await swapReversedLayouts(db)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_content\` DROP COLUMN \`vertical_alignment\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_content\` DROP COLUMN \`vertical_alignment\`;`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_content\` DROP COLUMN \`vertical_alignment\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_content\` DROP COLUMN \`vertical_alignment\`;`)
}
