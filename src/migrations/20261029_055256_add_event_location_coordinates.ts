import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`events\` ADD \`location_coordinates_latitude\` numeric;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`location_coordinates_longitude\` numeric;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`location_coordinates_geocode_status\` text;`)
  await db.run(
    sql`CREATE INDEX \`events_location_coordinates_location_coordinates_latitud_idx\` ON \`events\` (\`location_coordinates_latitude\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`events_location_coordinates_location_coordinates_longitu_idx\` ON \`events\` (\`location_coordinates_longitude\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`_events_v\` ADD \`version_location_coordinates_latitude\` numeric;`,
  )
  await db.run(
    sql`ALTER TABLE \`_events_v\` ADD \`version_location_coordinates_longitude\` numeric;`,
  )
  await db.run(
    sql`ALTER TABLE \`_events_v\` ADD \`version_location_coordinates_geocode_status\` text;`,
  )
  await db.run(
    sql`CREATE INDEX \`_events_v_version_location_coordinates_version_location__idx\` ON \`_events_v\` (\`version_location_coordinates_latitude\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_events_v_version_location_coordinates_version_locatio_1_idx\` ON \`_events_v\` (\`version_location_coordinates_longitude\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`events_location_coordinates_location_coordinates_latitud_idx\`;`)
  await db.run(sql`DROP INDEX \`events_location_coordinates_location_coordinates_longitu_idx\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`location_coordinates_latitude\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`location_coordinates_longitude\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`location_coordinates_geocode_status\`;`)
  await db.run(sql`DROP INDEX \`_events_v_version_location_coordinates_version_location__idx\`;`)
  await db.run(sql`DROP INDEX \`_events_v_version_location_coordinates_version_locatio_1_idx\`;`)
  await db.run(
    sql`ALTER TABLE \`_events_v\` DROP COLUMN \`version_location_coordinates_latitude\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_events_v\` DROP COLUMN \`version_location_coordinates_longitude\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_events_v\` DROP COLUMN \`version_location_coordinates_geocode_status\`;`,
  )
}
