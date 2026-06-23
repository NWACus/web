import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Generalize the single `use_native_forecasts` rollout flag into a per-product group
  // (`nativeProducts: { forecast, warning }`). Both products inherit the old value so a
  // center currently on the native forecast page (warning banner included) is unchanged.
  await db.run(
    sql`ALTER TABLE \`settings\` ADD \`native_products_forecast\` integer DEFAULT false;`,
  )
  await db.run(sql`ALTER TABLE \`settings\` ADD \`native_products_warning\` integer DEFAULT false;`)
  await db.run(
    sql`UPDATE \`settings\` SET \`native_products_forecast\` = \`use_native_forecasts\`, \`native_products_warning\` = \`use_native_forecasts\`;`,
  )
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`use_native_forecasts\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`settings\` ADD \`use_native_forecasts\` integer DEFAULT false;`)
  // Restore from the forecast flag (the original single-flag semantics).
  await db.run(
    sql`UPDATE \`settings\` SET \`use_native_forecasts\` = \`native_products_forecast\`;`,
  )
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`native_products_forecast\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`native_products_warning\`;`)
}
