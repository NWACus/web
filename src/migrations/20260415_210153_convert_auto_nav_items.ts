import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`navigations_forecasts_items_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`navigations_forecasts_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`navigations_forecasts_items_items_order_idx\` ON \`navigations_forecasts_items_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`navigations_forecasts_items_items_parent_id_idx\` ON \`navigations_forecasts_items_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`navigations_forecasts_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`navigations\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`navigations_forecasts_items_order_idx\` ON \`navigations_forecasts_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`navigations_forecasts_items_parent_id_idx\` ON \`navigations_forecasts_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`navigations_observations_items_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`navigations_observations_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`navigations_observations_items_items_order_idx\` ON \`navigations_observations_items_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`navigations_observations_items_items_parent_id_idx\` ON \`navigations_observations_items_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`navigations_observations_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`navigations\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`navigations_observations_items_order_idx\` ON \`navigations_observations_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`navigations_observations_items_parent_id_idx\` ON \`navigations_observations_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_navigations_v_version_forecasts_items_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_navigations_v_version_forecasts_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_forecasts_items_items_order_idx\` ON \`_navigations_v_version_forecasts_items_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_forecasts_items_items_parent_id_idx\` ON \`_navigations_v_version_forecasts_items_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_navigations_v_version_forecasts_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_navigations_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_forecasts_items_order_idx\` ON \`_navigations_v_version_forecasts_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_forecasts_items_parent_id_idx\` ON \`_navigations_v_version_forecasts_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_navigations_v_version_observations_items_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_navigations_v_version_observations_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_observations_items_items_order_idx\` ON \`_navigations_v_version_observations_items_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_observations_items_items_parent_id_idx\` ON \`_navigations_v_version_observations_items_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_navigations_v_version_observations_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_navigations_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_observations_items_order_idx\` ON \`_navigations_v_version_observations_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_observations_items_parent_id_idx\` ON \`_navigations_v_version_observations_items\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`forecasts_link_type\` text DEFAULT 'internal';`,
  )
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`forecasts_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`forecasts_link_label\` text;`)
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`forecasts_link_new_tab\` integer DEFAULT true;`,
  )
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`blog_link_type\` text DEFAULT 'internal';`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`blog_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`blog_link_label\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`blog_link_new_tab\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`events_link_type\` text DEFAULT 'internal';`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`events_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`events_link_label\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`events_link_new_tab\` integer DEFAULT true;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_forecasts_link_type\` text DEFAULT 'internal';`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_forecasts_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_forecasts_link_label\` text;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_forecasts_link_new_tab\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_blog_link_type\` text DEFAULT 'internal';`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_blog_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_blog_link_label\` text;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_blog_link_new_tab\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_events_link_type\` text DEFAULT 'internal';`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_events_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_events_link_label\` text;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_events_link_new_tab\` integer DEFAULT true;`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`navigations_forecasts_items_items\`;`)
  await db.run(sql`DROP TABLE \`navigations_forecasts_items\`;`)
  await db.run(sql`DROP TABLE \`navigations_observations_items_items\`;`)
  await db.run(sql`DROP TABLE \`navigations_observations_items\`;`)
  await db.run(sql`DROP TABLE \`_navigations_v_version_forecasts_items_items\`;`)
  await db.run(sql`DROP TABLE \`_navigations_v_version_forecasts_items\`;`)
  await db.run(sql`DROP TABLE \`_navigations_v_version_observations_items_items\`;`)
  await db.run(sql`DROP TABLE \`_navigations_v_version_observations_items\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`forecasts_link_type\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`forecasts_link_url\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`forecasts_link_label\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`forecasts_link_new_tab\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`blog_link_type\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`blog_link_url\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`blog_link_label\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`blog_link_new_tab\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`events_link_type\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`events_link_url\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`events_link_label\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`events_link_new_tab\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_forecasts_link_type\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_forecasts_link_url\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_forecasts_link_label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_forecasts_link_new_tab\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_blog_link_type\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_blog_link_url\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_blog_link_label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_blog_link_new_tab\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_events_link_type\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_events_link_url\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_events_link_label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_events_link_new_tab\`;`)
}
