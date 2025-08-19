import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`settings\` ADD \`phone_label\` text;`)
  await db.run(sql`ALTER TABLE \`settings\` ADD \`phone_secondary_label\` text;`)
  await db.run(sql`ALTER TABLE \`settings\` ADD \`phone_secondary\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`phone_label\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`phone_secondary_label\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`phone_secondary\`;`)
}
