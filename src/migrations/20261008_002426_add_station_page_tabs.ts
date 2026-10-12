import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`station_pages\` ADD \`tabs_table\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`station_pages\` ADD \`tabs_graphs\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`station_pages\` ADD \`tabs_csv\` integer DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`station_pages\` DROP COLUMN \`tabs_table\`;`)
  await db.run(sql`ALTER TABLE \`station_pages\` DROP COLUMN \`tabs_graphs\`;`)
  await db.run(sql`ALTER TABLE \`station_pages\` DROP COLUMN \`tabs_csv\`;`)
}
