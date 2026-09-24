import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`settings\` ADD \`native_products_forecast\` integer DEFAULT false;`,
  )
  await db.run(sql`ALTER TABLE \`settings\` ADD \`native_products_warning\` integer DEFAULT false;`)
  await db.run(
    sql`ALTER TABLE \`settings\` ADD \`native_products_danger_map\` integer DEFAULT false;`,
  )
  await db.run(sql`ALTER TABLE \`settings\` ADD \`native_products_weather\` integer DEFAULT false;`)
  await db.run(
    sql`ALTER TABLE \`settings\` ADD \`native_products_station_map\` integer DEFAULT false;`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`native_products_forecast\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`native_products_warning\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`native_products_danger_map\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`native_products_weather\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`native_products_station_map\`;`)
}
