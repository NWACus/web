import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const tables = [
    'home_pages_blocks_blog_list',
    '_home_pages_v_blocks_blog_list',
    'pages_blocks_blog_list',
    '_pages_v_blocks_blog_list',
  ]

  for (const table of tables) {
    // Add the column with a default value first
    await db.run(sql`ALTER TABLE \`${table}\` ADD \`show_view_all_button\` integer DEFAULT true;`)

    // Update based on postOptions value
    await db.run(
      sql`UPDATE \`${table}\` SET \`show_view_all_button\` = CASE 
        WHEN \`postOptions\` = 'static' THEN 0
        WHEN \`postOptions\` = 'dynamic' THEN 1
        ELSE 1 
      END;`,
    )
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  const tables = [
    'home_pages_blocks_blog_list',
    '_home_pages_v_blocks_blog_list',
    'pages_blocks_blog_list',
    '_pages_v_blocks_blog_list',
  ]

  for (const table of tables) {
    await db.run(sql`ALTER TABLE \`${table}\` DROP COLUMN \`show_view_all_button\`;`)
  }
}
