import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`home_pages_blocks_observations_widget\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`show_header\` integer DEFAULT true,
  	\`heading\` text DEFAULT 'Recent Observations',
  	\`tab\` text DEFAULT 'observations',
  	\`avalanches_observed_only\` integer,
  	\`date_range\` text DEFAULT 'past2Weeks',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_observations_widget_order_idx\` ON \`home_pages_blocks_observations_widget\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_observations_widget_parent_id_idx\` ON \`home_pages_blocks_observations_widget\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_observations_widget_path_idx\` ON \`home_pages_blocks_observations_widget\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_texts_order_parent\` ON \`home_pages_texts\` (\`order\`,\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_observations_widget\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`show_header\` integer DEFAULT true,
  	\`heading\` text DEFAULT 'Recent Observations',
  	\`tab\` text DEFAULT 'observations',
  	\`avalanches_observed_only\` integer,
  	\`date_range\` text DEFAULT 'past2Weeks',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_observations_widget_order_idx\` ON \`_home_pages_v_blocks_observations_widget\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_observations_widget_parent_id_idx\` ON \`_home_pages_v_blocks_observations_widget\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_observations_widget_path_idx\` ON \`_home_pages_v_blocks_observations_widget\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_texts_order_parent\` ON \`_home_pages_v_texts\` (\`order\`,\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_observations_widget\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`show_header\` integer DEFAULT true,
  	\`heading\` text DEFAULT 'Recent Observations',
  	\`tab\` text DEFAULT 'observations',
  	\`avalanches_observed_only\` integer,
  	\`date_range\` text DEFAULT 'past2Weeks',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_observations_widget_order_idx\` ON \`pages_blocks_observations_widget\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_observations_widget_parent_id_idx\` ON \`pages_blocks_observations_widget\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_observations_widget_path_idx\` ON \`pages_blocks_observations_widget\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_texts_order_parent\` ON \`pages_texts\` (\`order\`,\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_observations_widget\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`show_header\` integer DEFAULT true,
  	\`heading\` text DEFAULT 'Recent Observations',
  	\`tab\` text DEFAULT 'observations',
  	\`avalanches_observed_only\` integer,
  	\`date_range\` text DEFAULT 'past2Weeks',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_observations_widget_order_idx\` ON \`_pages_v_blocks_observations_widget\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_observations_widget_parent_id_idx\` ON \`_pages_v_blocks_observations_widget\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_observations_widget_path_idx\` ON \`_pages_v_blocks_observations_widget\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_texts_order_parent\` ON \`_pages_v_texts\` (\`order\`,\`parent_id\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`home_pages_blocks_observations_widget\`;`)
  await db.run(sql`DROP TABLE \`home_pages_texts\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_observations_widget\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_texts\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_observations_widget\`;`)
  await db.run(sql`DROP TABLE \`pages_texts\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_observations_widget\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_texts\`;`)
}
