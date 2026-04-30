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
  await db.run(sql`CREATE TABLE \`navigations_donate_items_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`navigations_donate_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`navigations_donate_items_items_order_idx\` ON \`navigations_donate_items_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`navigations_donate_items_items_parent_id_idx\` ON \`navigations_donate_items_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`navigations_donate_items\` (
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
    sql`CREATE INDEX \`navigations_donate_items_order_idx\` ON \`navigations_donate_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`navigations_donate_items_parent_id_idx\` ON \`navigations_donate_items\` (\`_parent_id\`);`,
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
  await db.run(sql`CREATE TABLE \`_navigations_v_version_donate_items_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_url\` text,
  	\`link_label\` text,
  	\`link_new_tab\` integer DEFAULT true,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_navigations_v_version_donate_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_donate_items_items_order_idx\` ON \`_navigations_v_version_donate_items_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_donate_items_items_parent_id_idx\` ON \`_navigations_v_version_donate_items_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_navigations_v_version_donate_items\` (
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
    sql`CREATE INDEX \`_navigations_v_version_donate_items_order_idx\` ON \`_navigations_v_version_donate_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_version_donate_items_parent_id_idx\` ON \`_navigations_v_version_donate_items\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`forecasts_options_display_mode\` text DEFAULT 'dropdown';`,
  )
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`forecasts_link_type\` text DEFAULT 'internal';`,
  )
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`forecasts_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`forecasts_link_label\` text;`)
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`forecasts_link_new_tab\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`observations_options_display_mode\` text DEFAULT 'dropdown';`,
  )
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`observations_link_type\` text DEFAULT 'internal';`,
  )
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`observations_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`observations_link_label\` text;`)
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`observations_link_new_tab\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`weather_options_display_mode\` text DEFAULT 'dropdown';`,
  )
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`weather_link_type\` text DEFAULT 'internal';`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`weather_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`weather_link_label\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`weather_link_new_tab\` integer DEFAULT true;`)
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`education_options_display_mode\` text DEFAULT 'dropdown';`,
  )
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`education_link_type\` text DEFAULT 'internal';`,
  )
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`education_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`education_link_label\` text;`)
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`education_link_new_tab\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`accidents_options_display_mode\` text DEFAULT 'dropdown';`,
  )
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`accidents_link_type\` text DEFAULT 'internal';`,
  )
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`accidents_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`accidents_link_label\` text;`)
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`accidents_link_new_tab\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`blog_options_display_mode\` text DEFAULT 'link';`,
  )
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`blog_link_type\` text DEFAULT 'internal';`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`blog_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`blog_link_label\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`blog_link_new_tab\` integer DEFAULT true;`)
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`events_options_display_mode\` text DEFAULT 'link';`,
  )
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`events_link_type\` text DEFAULT 'internal';`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`events_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`events_link_label\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`events_link_new_tab\` integer DEFAULT true;`)
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`about_options_display_mode\` text DEFAULT 'dropdown';`,
  )
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`about_link_type\` text DEFAULT 'internal';`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`about_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`about_link_label\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`about_link_new_tab\` integer DEFAULT true;`)
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`support_options_display_mode\` text DEFAULT 'dropdown';`,
  )
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`support_link_type\` text DEFAULT 'internal';`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`support_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`support_link_label\` text;`)
  await db.run(sql`ALTER TABLE \`navigations\` ADD \`support_link_new_tab\` integer DEFAULT true;`)
  await db.run(
    sql`ALTER TABLE \`navigations\` ADD \`donate_options_display_mode\` text DEFAULT 'button';`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_forecasts_options_display_mode\` text DEFAULT 'dropdown';`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_forecasts_link_type\` text DEFAULT 'internal';`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_forecasts_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_forecasts_link_label\` text;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_forecasts_link_new_tab\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_observations_options_display_mode\` text DEFAULT 'dropdown';`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_observations_link_type\` text DEFAULT 'internal';`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_observations_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_observations_link_label\` text;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_observations_link_new_tab\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_weather_options_display_mode\` text DEFAULT 'dropdown';`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_weather_link_type\` text DEFAULT 'internal';`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_weather_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_weather_link_label\` text;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_weather_link_new_tab\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_education_options_display_mode\` text DEFAULT 'dropdown';`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_education_link_type\` text DEFAULT 'internal';`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_education_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_education_link_label\` text;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_education_link_new_tab\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_accidents_options_display_mode\` text DEFAULT 'dropdown';`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_accidents_link_type\` text DEFAULT 'internal';`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_accidents_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_accidents_link_label\` text;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_accidents_link_new_tab\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_blog_options_display_mode\` text DEFAULT 'link';`,
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
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_events_options_display_mode\` text DEFAULT 'link';`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_events_link_type\` text DEFAULT 'internal';`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_events_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_events_link_label\` text;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_events_link_new_tab\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_about_options_display_mode\` text DEFAULT 'dropdown';`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_about_link_type\` text DEFAULT 'internal';`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_about_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_about_link_label\` text;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_about_link_new_tab\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_support_options_display_mode\` text DEFAULT 'dropdown';`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_support_link_type\` text DEFAULT 'internal';`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_support_link_url\` text;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` ADD \`version_support_link_label\` text;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_support_link_new_tab\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` ADD \`version_donate_options_display_mode\` text DEFAULT 'button';`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`navigations_forecasts_items_items\`;`)
  await db.run(sql`DROP TABLE \`navigations_forecasts_items\`;`)
  await db.run(sql`DROP TABLE \`navigations_observations_items_items\`;`)
  await db.run(sql`DROP TABLE \`navigations_observations_items\`;`)
  await db.run(sql`DROP TABLE \`navigations_donate_items_items\`;`)
  await db.run(sql`DROP TABLE \`navigations_donate_items\`;`)
  await db.run(sql`DROP TABLE \`_navigations_v_version_forecasts_items_items\`;`)
  await db.run(sql`DROP TABLE \`_navigations_v_version_forecasts_items\`;`)
  await db.run(sql`DROP TABLE \`_navigations_v_version_observations_items_items\`;`)
  await db.run(sql`DROP TABLE \`_navigations_v_version_observations_items\`;`)
  await db.run(sql`DROP TABLE \`_navigations_v_version_donate_items_items\`;`)
  await db.run(sql`DROP TABLE \`_navigations_v_version_donate_items\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`forecasts_options_display_mode\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`forecasts_link_type\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`forecasts_link_url\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`forecasts_link_label\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`forecasts_link_new_tab\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`observations_options_display_mode\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`observations_link_type\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`observations_link_url\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`observations_link_label\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`observations_link_new_tab\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`weather_options_display_mode\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`weather_link_type\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`weather_link_url\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`weather_link_label\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`weather_link_new_tab\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`education_options_display_mode\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`education_link_type\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`education_link_url\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`education_link_label\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`education_link_new_tab\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`accidents_options_display_mode\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`accidents_link_type\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`accidents_link_url\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`accidents_link_label\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`accidents_link_new_tab\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`blog_options_display_mode\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`blog_link_type\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`blog_link_url\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`blog_link_label\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`blog_link_new_tab\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`events_options_display_mode\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`events_link_type\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`events_link_url\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`events_link_label\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`events_link_new_tab\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`about_options_display_mode\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`about_link_type\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`about_link_url\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`about_link_label\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`about_link_new_tab\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`support_options_display_mode\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`support_link_type\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`support_link_url\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`support_link_label\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`support_link_new_tab\`;`)
  await db.run(sql`ALTER TABLE \`navigations\` DROP COLUMN \`donate_options_display_mode\`;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_forecasts_options_display_mode\`;`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_forecasts_link_type\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_forecasts_link_url\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_forecasts_link_label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_forecasts_link_new_tab\`;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_observations_options_display_mode\`;`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_observations_link_type\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_observations_link_url\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_observations_link_label\`;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_observations_link_new_tab\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_weather_options_display_mode\`;`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_weather_link_type\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_weather_link_url\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_weather_link_label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_weather_link_new_tab\`;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_education_options_display_mode\`;`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_education_link_type\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_education_link_url\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_education_link_label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_education_link_new_tab\`;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_accidents_options_display_mode\`;`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_accidents_link_type\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_accidents_link_url\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_accidents_link_label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_accidents_link_new_tab\`;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_blog_options_display_mode\`;`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_blog_link_type\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_blog_link_url\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_blog_link_label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_blog_link_new_tab\`;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_events_options_display_mode\`;`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_events_link_type\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_events_link_url\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_events_link_label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_events_link_new_tab\`;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_about_options_display_mode\`;`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_about_link_type\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_about_link_url\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_about_link_label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_about_link_new_tab\`;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_support_options_display_mode\`;`,
  )
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_support_link_type\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_support_link_url\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_support_link_label\`;`)
  await db.run(sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_support_link_new_tab\`;`)
  await db.run(
    sql`ALTER TABLE \`_navigations_v\` DROP COLUMN \`version_donate_options_display_mode\`;`,
  )
}
