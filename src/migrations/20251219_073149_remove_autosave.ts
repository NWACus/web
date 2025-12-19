import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`_home_pages_v_autosave_idx\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v\` DROP COLUMN \`autosave\`;`)
  await db.run(sql`DROP INDEX \`_pages_v_autosave_idx\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` DROP COLUMN \`autosave\`;`)
  await db.run(sql`DROP INDEX \`_posts_v_autosave_idx\`;`)
  await db.run(sql`ALTER TABLE \`_posts_v\` DROP COLUMN \`autosave\`;`)
  await db.run(sql`DROP INDEX \`_events_v_autosave_idx\`;`)
  await db.run(sql`ALTER TABLE \`_events_v\` DROP COLUMN \`autosave\`;`)
  await db.run(sql`DROP INDEX \`_providers_v_autosave_idx\`;`)
  await db.run(sql`ALTER TABLE \`_providers_v\` DROP COLUMN \`autosave\`;`)
  await db.run(sql`DROP INDEX \`_courses_v_autosave_idx\`;`)
  await db.run(sql`ALTER TABLE \`_courses_v\` DROP COLUMN \`autosave\`;`)
  await db.run(sql`DROP INDEX \`_navigations_v_autosave_idx\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`autosave\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`_home_pages_v\` ADD \`autosave\` integer;`)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_autosave_idx\` ON \`_home_pages_v\` (\`autosave\`);`,
  )
  await db.run(sql`ALTER TABLE \`_pages_v\` ADD \`autosave\` integer;`)
  await db.run(sql`CREATE INDEX \`_pages_v_autosave_idx\` ON \`_pages_v\` (\`autosave\`);`)
  await db.run(sql`ALTER TABLE \`_posts_v\` ADD \`autosave\` integer;`)
  await db.run(sql`CREATE INDEX \`_posts_v_autosave_idx\` ON \`_posts_v\` (\`autosave\`);`)
  await db.run(sql`ALTER TABLE \`_events_v\` ADD \`autosave\` integer;`)
  await db.run(sql`CREATE INDEX \`_events_v_autosave_idx\` ON \`_events_v\` (\`autosave\`);`)
  await db.run(sql`ALTER TABLE \`_providers_v\` ADD \`autosave\` integer;`)
  await db.run(sql`CREATE INDEX \`_providers_v_autosave_idx\` ON \`_providers_v\` (\`autosave\`);`)
  await db.run(sql`ALTER TABLE \`_courses_v\` ADD \`autosave\` integer;`)
  await db.run(sql`CREATE INDEX \`_courses_v_autosave_idx\` ON \`_courses_v\` (\`autosave\`);`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`autosave\` integer;`)
  await db.run(
    sql`CREATE INDEX \`_navigations_v_autosave_idx\` ON \`_navigations_v\` (\`autosave\`);`,
  )
}
