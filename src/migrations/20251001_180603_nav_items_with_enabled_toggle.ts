import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`navigations_blog_items_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`navigations_blog_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`navigations_blog_items_items_order_idx\` ON \`navigations_blog_items_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`navigations_blog_items_items_parent_id_idx\` ON \`navigations_blog_items_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`navigations_blog_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`navigations\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`navigations_blog_items_order_idx\` ON \`navigations_blog_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`navigations_blog_items_parent_id_idx\` ON \`navigations_blog_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`navigations_events_items_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`navigations_events_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`navigations_events_items_items_order_idx\` ON \`navigations_events_items_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`navigations_events_items_items_parent_id_idx\` ON \`navigations_events_items_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`navigations_events_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`navigations\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`navigations_events_items_order_idx\` ON \`navigations_events_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`navigations_events_items_parent_id_idx\` ON \`navigations_events_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_navigations_v_version_blog_items_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_navigations_v_version_blog_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_blog_items_items_order_idx\` ON \`_navigations_v_version_blog_items_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_blog_items_items_parent_id_idx\` ON \`_navigations_v_version_blog_items_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_navigations_v_version_blog_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_navigations_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_blog_items_order_idx\` ON \`_navigations_v_version_blog_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_blog_items_parent_id_idx\` ON \`_navigations_v_version_blog_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_navigations_v_version_events_items_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_navigations_v_version_events_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_events_items_items_order_idx\` ON \`_navigations_v_version_events_items_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_events_items_items_parent_id_idx\` ON \`_navigations_v_version_events_items_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_navigations_v_version_events_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_navigations_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_events_items_order_idx\` ON \`_navigations_v_version_events_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_events_items_parent_id_idx\` ON \`_navigations_v_version_events_items\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`weather_options_enabled\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`education_options_enabled\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`accidents_options_enabled\` integer DEFAULT true;`,
  )
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`blog_options_enabled\` integer DEFAULT true;`)
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`events_options_enabled\` integer DEFAULT true;`,
  )
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`about_options_enabled\` integer DEFAULT true;`)
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`support_options_enabled\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`donate_options_enabled\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_weather_options_enabled\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_education_options_enabled\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_accidents_options_enabled\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_blog_options_enabled\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_events_options_enabled\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_about_options_enabled\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_support_options_enabled\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_donate_options_enabled\` integer DEFAULT true;`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`navigations_blog_items_items\`;`)
  await db.run(sql`DROP TABLE \`navigations_blog_items\`;`)
  await db.run(sql`DROP TABLE \`navigations_events_items_items\`;`)
  await db.run(sql`DROP TABLE \`navigations_events_items\`;`)
  await db.run(sql`DROP TABLE \`_navigations_v_version_blog_items_items\`;`)
  await db.run(sql`DROP TABLE \`_navigations_v_version_blog_items\`;`)
  await db.run(sql`DROP TABLE \`_navigations_v_version_events_items_items\`;`)
  await db.run(sql`DROP TABLE \`_navigations_v_version_events_items\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`weather_options_enabled\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`education_options_enabled\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`accidents_options_enabled\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`blog_options_enabled\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`events_options_enabled\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`about_options_enabled\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`support_options_enabled\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`donate_options_enabled\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_weather_options_enabled\`;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_education_options_enabled\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_accidents_options_enabled\`;`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_blog_options_enabled\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_events_options_enabled\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_about_options_enabled\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_support_options_enabled\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_donate_options_enabled\`;`)
}
