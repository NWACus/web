import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`posts_blocks_in_content\` RENAME COLUMN "block_id" TO "doc_id";`)
  await db.run(
    sql`ALTER TABLE \`_posts_v_version_blocks_in_content\` RENAME COLUMN "block_id" TO "doc_id";`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`posts_blocks_in_content\` RENAME COLUMN "doc_id" TO "block_id";`)
  await db.run(
    sql`ALTER TABLE \`_posts_v_version_blocks_in_content\` RENAME COLUMN "doc_id" TO "block_id";`,
  )
}
