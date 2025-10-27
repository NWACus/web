import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const DEFAULT_LEXICAL_VALUE =
    '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[],"direction":"ltr","textStyle":"","textFormat":0}],"direction":"ltr"}}'

  // home_pages_blocks_content_columns
  await db.run(
    sql.raw(
      `ALTER TABLE \`home_pages_blocks_content_columns\` ADD COLUMN \`__new_rich_text\` text DEFAULT '${DEFAULT_LEXICAL_VALUE}';`,
    ),
  )
  await db.run(
    sql.raw(
      `UPDATE \`home_pages_blocks_content_columns\` SET \`__new_rich_text\` = COALESCE(\`rich_text\`, '${DEFAULT_LEXICAL_VALUE}');`,
    ),
  )
  await db.run(sql`ALTER TABLE \`home_pages_blocks_content_columns\` DROP COLUMN \`rich_text\`;`)
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_content_columns\` RENAME COLUMN \`__new_rich_text\` TO \`rich_text\`;`,
  )

  // _home_pages_v_blocks_content_columns
  await db.run(
    sql.raw(
      `ALTER TABLE \`_home_pages_v_blocks_content_columns\` ADD COLUMN \`__new_rich_text\` text DEFAULT '${DEFAULT_LEXICAL_VALUE}';`,
    ),
  )
  await db.run(
    sql.raw(
      `UPDATE \`_home_pages_v_blocks_content_columns\` SET \`__new_rich_text\` = COALESCE(\`rich_text\`, '${DEFAULT_LEXICAL_VALUE}');`,
    ),
  )
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_content_columns\` DROP COLUMN \`rich_text\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_content_columns\` RENAME COLUMN \`__new_rich_text\` TO \`rich_text\`;`,
  )

  // pages_blocks_content_columns
  await db.run(
    sql.raw(
      `ALTER TABLE \`pages_blocks_content_columns\` ADD COLUMN \`__new_rich_text\` text DEFAULT '${DEFAULT_LEXICAL_VALUE}';`,
    ),
  )
  await db.run(
    sql.raw(
      `UPDATE \`pages_blocks_content_columns\` SET \`__new_rich_text\` = COALESCE(\`rich_text\`, '${DEFAULT_LEXICAL_VALUE}');`,
    ),
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_content_columns\` DROP COLUMN \`rich_text\`;`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_content_columns\` RENAME COLUMN \`__new_rich_text\` TO \`rich_text\`;`,
  )

  // _pages_v_blocks_content_columns
  await db.run(
    sql.raw(
      `ALTER TABLE \`_pages_v_blocks_content_columns\` ADD COLUMN \`__new_rich_text\` text DEFAULT '${DEFAULT_LEXICAL_VALUE}';`,
    ),
  )
  await db.run(
    sql.raw(
      `UPDATE \`_pages_v_blocks_content_columns\` SET \`__new_rich_text\` = COALESCE(\`rich_text\`, '${DEFAULT_LEXICAL_VALUE}');`,
    ),
  )
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_content_columns\` DROP COLUMN \`rich_text\`;`)
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_content_columns\` RENAME COLUMN \`__new_rich_text\` TO \`rich_text\`;`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Note: This down migration removes the DEFAULT constraint but does not restore
  // originally NULL values. The up migration permanently converts NULL to the default
  // Lexical value, and there's no way to determine which values were originally NULL.

  // home_pages_blocks_content_columns
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_content_columns\` ADD COLUMN \`__new_rich_text\` text;`,
  )
  await db.run(
    sql`UPDATE \`home_pages_blocks_content_columns\` SET \`__new_rich_text\` = \`rich_text\`;`,
  )
  await db.run(sql`ALTER TABLE \`home_pages_blocks_content_columns\` DROP COLUMN \`rich_text\`;`)
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_content_columns\` RENAME COLUMN \`__new_rich_text\` TO \`rich_text\`;`,
  )

  // _home_pages_v_blocks_content_columns
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_content_columns\` ADD COLUMN \`__new_rich_text\` text;`,
  )
  await db.run(
    sql`UPDATE \`_home_pages_v_blocks_content_columns\` SET \`__new_rich_text\` = \`rich_text\`;`,
  )
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_content_columns\` DROP COLUMN \`rich_text\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_content_columns\` RENAME COLUMN \`__new_rich_text\` TO \`rich_text\`;`,
  )

  // pages_blocks_content_columns
  await db.run(
    sql`ALTER TABLE \`pages_blocks_content_columns\` ADD COLUMN \`__new_rich_text\` text;`,
  )
  await db.run(
    sql`UPDATE \`pages_blocks_content_columns\` SET \`__new_rich_text\` = \`rich_text\`;`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_content_columns\` DROP COLUMN \`rich_text\`;`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_content_columns\` RENAME COLUMN \`__new_rich_text\` TO \`rich_text\`;`,
  )

  // _pages_v_blocks_content_columns
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_content_columns\` ADD COLUMN \`__new_rich_text\` text;`,
  )
  await db.run(
    sql`UPDATE \`_pages_v_blocks_content_columns\` SET \`__new_rich_text\` = \`rich_text\`;`,
  )
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_content_columns\` DROP COLUMN \`rich_text\`;`)
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_content_columns\` RENAME COLUMN \`__new_rich_text\` TO \`rich_text\`;`,
  )
}
