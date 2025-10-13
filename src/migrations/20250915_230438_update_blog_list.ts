import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`pages_blocks_blog_list\` RENAME COLUMN "sort_by" TO "dynamic_options_sort_by";`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_blog_list\` RENAME COLUMN "max_posts" TO "dynamic_options_max_posts";`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_blog_list\` RENAME COLUMN "sort_by" TO "dynamic_options_sort_by";`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_blog_list\` RENAME COLUMN "max_posts" TO "dynamic_options_max_posts";`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_blog_list\` ADD \`post_options\` text DEFAULT 'dynamic';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_blog_list\` ADD \`post_options\` text DEFAULT 'dynamic';`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`pages_blocks_blog_list\` RENAME COLUMN "dynamic_options_sort_by" TO "sort_by";`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_blog_list\` RENAME COLUMN "dynamic_options_max_posts" TO "max_posts";`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_blog_list\` RENAME COLUMN "dynamic_options_sort_by" TO "sort_by";`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_blog_list\` RENAME COLUMN "dynamic_options_max_posts" TO "max_posts";`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_blog_list\` DROP COLUMN \`post_options\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_blog_list\` DROP COLUMN \`post_options\`;`)
}
