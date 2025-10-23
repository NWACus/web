import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`posts\` ADD \`show_authors\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`posts\` ADD \`show_date\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`_posts_v\` ADD \`version_show_authors\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_posts_v\` ADD \`version_show_date\` integer DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`posts\` DROP COLUMN \`show_authors\`;`)
  await db.run(sql`ALTER TABLE \`posts\` DROP COLUMN \`show_date\`;`)
  await db.run(sql`ALTER TABLE \`_posts_v\` DROP COLUMN \`version_show_authors\`;`)
  await db.run(sql`ALTER TABLE \`_posts_v\` DROP COLUMN \`version_show_date\`;`)
}
