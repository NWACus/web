import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

// Navigation section names that have items with potential sub-items
const NAV_SECTIONS = ['weather', 'education', 'accidents', 'blog', 'events', 'about', 'support']

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Add the new standalone label column to all navigation items tables
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

  // Migrate existing data: copy link_label to standalone label for items that have sub-items.
  // Items with sub-items use the standalone label field, not the link group label.
  for (const section of NAV_SECTIONS) {
    const itemsTable = `navigations_${section}_items`
    const subItemsTable = `navigations_${section}_items_items`
    const versionItemsTable = `_navigations_v_version_${section}_items`
    const versionSubItemsTable = `_navigations_v_version_${section}_items_items`

    // Update items that have sub-items: copy link_label to label, then clear link fields
    await db.run(
      sql.raw(`
      UPDATE ${itemsTable}
      SET label = link_label
      WHERE link_label IS NOT NULL
        AND (label IS NULL OR label = '')
        AND id IN (SELECT DISTINCT _parent_id FROM ${subItemsTable})
    `),
    )

    // Clear link fields for items with sub-items (link is not used for accordion items)
    await db.run(
      sql.raw(`
      UPDATE ${itemsTable}
      SET link_type = NULL, link_url = NULL, link_label = NULL, link_new_tab = NULL
      WHERE id IN (SELECT DISTINCT _parent_id FROM ${subItemsTable})
    `),
    )

    // Same for version tables
    await db.run(
      sql.raw(`
      UPDATE ${versionItemsTable}
      SET label = link_label
      WHERE link_label IS NOT NULL
        AND (label IS NULL OR label = '')
        AND id IN (SELECT DISTINCT _parent_id FROM ${versionSubItemsTable})
    `),
    )

    await db.run(
      sql.raw(`
      UPDATE ${versionItemsTable}
      SET link_type = NULL, link_url = NULL, link_label = NULL, link_new_tab = NULL
      WHERE id IN (SELECT DISTINCT _parent_id FROM ${versionSubItemsTable})
    `),
    )
  }
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
