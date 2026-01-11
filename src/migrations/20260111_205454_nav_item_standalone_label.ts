import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`navigations_weather_items\` ADD \`label\` text;`)
  await db.run(sql`ALTER TABLE \`navigations_education_items\` ADD \`label\` text;`)
  await db.run(sql`ALTER TABLE \`navigations_accidents_items\` ADD \`label\` text;`)
  await db.run(sql`ALTER TABLE \`navigations_blog_items\` ADD \`label\` text;`)
  await db.run(sql`ALTER TABLE \`navigations_events_items\` ADD \`label\` text;`)
  await db.run(sql`ALTER TABLE \`navigations_about_items\` ADD \`label\` text;`)
  await db.run(sql`ALTER TABLE \`navigations_support_items\` ADD \`label\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v_version_weather_items\` ADD \`label\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v_version_education_items\` ADD \`label\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v_version_accidents_items\` ADD \`label\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v_version_blog_items\` ADD \`label\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v_version_events_items\` ADD \`label\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v_version_about_items\` ADD \`label\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v_version_support_items\` ADD \`label\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`navigations_weather_items\` DROP COLUMN \`label\`;`)
  await db.run(sql`ALTER TABLE \`navigations_education_items\` DROP COLUMN \`label\`;`)
  await db.run(sql`ALTER TABLE \`navigations_accidents_items\` DROP COLUMN \`label\`;`)
  await db.run(sql`ALTER TABLE \`navigations_blog_items\` DROP COLUMN \`label\`;`)
  await db.run(sql`ALTER TABLE \`navigations_events_items\` DROP COLUMN \`label\`;`)
  await db.run(sql`ALTER TABLE \`navigations_about_items\` DROP COLUMN \`label\`;`)
  await db.run(sql`ALTER TABLE \`navigations_support_items\` DROP COLUMN \`label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v_version_weather_items\` DROP COLUMN \`label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v_version_education_items\` DROP COLUMN \`label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v_version_accidents_items\` DROP COLUMN \`label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v_version_blog_items\` DROP COLUMN \`label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v_version_events_items\` DROP COLUMN \`label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v_version_about_items\` DROP COLUMN \`label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v_version_support_items\` DROP COLUMN \`label\`;`)
}
