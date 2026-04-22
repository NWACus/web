import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // status defaults to 'not_started' so existing rows satisfy NOT NULL
  await db.run(
    sql`ALTER TABLE \`tenants\` ADD \`provisioning_status\` text DEFAULT 'not_started' NOT NULL;`,
  )
  // lastRunAt is nullable — brand-new tenants have no run to record yet.
  await db.run(sql`ALTER TABLE \`tenants\` ADD \`provisioning_last_run_at\` text;`)
  await db.run(sql`ALTER TABLE \`tenants\` ADD \`provisioning_failed\` text;`)

  // Only backfill tenants that have evidence of a successful provision —
  // a settings row, a home page, AND a navigation. Half-provisioned tenants
  // stay at the default 'not_started' so the checklist surfaces a Rerun
  // affordance instead of claiming they're done.
  await db.run(sql`
    UPDATE \`tenants\`
    SET \`provisioning_status\` = 'complete',
        \`provisioning_last_run_at\` = \`created_at\`
    WHERE EXISTS (SELECT 1 FROM \`settings\` WHERE \`settings\`.\`tenant_id\` = \`tenants\`.\`id\`)
      AND EXISTS (SELECT 1 FROM \`home_pages\` WHERE \`home_pages\`.\`tenant_id\` = \`tenants\`.\`id\`)
      AND EXISTS (SELECT 1 FROM \`navigations\` WHERE \`navigations\`.\`tenant_id\` = \`tenants\`.\`id\`)
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`tenants\` DROP COLUMN \`provisioning_status\`;`)
  await db.run(sql`ALTER TABLE \`tenants\` DROP COLUMN \`provisioning_last_run_at\`;`)
  await db.run(sql`ALTER TABLE \`tenants\` DROP COLUMN \`provisioning_failed\`;`)
}
