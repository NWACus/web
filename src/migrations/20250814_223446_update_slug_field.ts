import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`slug_lock\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` DROP COLUMN \`version_slug_lock\`;`)
  await db.run(sql`ALTER TABLE \`posts\` DROP COLUMN \`slug_lock\`;`)
  await db.run(sql`ALTER TABLE \`_posts_v\` DROP COLUMN \`version_slug_lock\`;`)
  await db.run(sql`ALTER TABLE \`tags\` DROP COLUMN \`slug_lock\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages\` ADD \`slug_lock\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` ADD \`version_slug_lock\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`posts\` ADD \`slug_lock\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`_posts_v\` ADD \`version_slug_lock\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`tags\` ADD \`slug_lock\` integer DEFAULT true;`)
}
