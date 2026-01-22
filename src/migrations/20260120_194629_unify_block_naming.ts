import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`home_pages_blocks_biography\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_image_quote\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_image_text_list_columns\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_image_text_list\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_biography\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_image_quote\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_image_text_list_columns\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_image_text_list\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_biography\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_image_quote\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_image_text_list_columns\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_image_text_list\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_biography\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_image_quote\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_image_text_list_columns\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_image_text_list\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`home_pages_blocks_biography\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`biography_id\` integer,
  	\`image_layout\` text DEFAULT 'left',
  	\`block_name\` text,
  	FOREIGN KEY (\`biography_id\`) REFERENCES \`biographies\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_biography_order_idx\` ON \`home_pages_blocks_biography\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_biography_parent_id_idx\` ON \`home_pages_blocks_biography\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_biography_path_idx\` ON \`home_pages_blocks_biography\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_biography_biography_idx\` ON \`home_pages_blocks_biography\` (\`biography_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_image_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`quote\` text,
  	\`author\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_quote_order_idx\` ON \`home_pages_blocks_image_quote\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_quote_parent_id_idx\` ON \`home_pages_blocks_image_quote\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_quote_path_idx\` ON \`home_pages_blocks_image_quote\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_quote_image_idx\` ON \`home_pages_blocks_image_quote\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_image_text_list_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`rich_text\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages_blocks_image_text_list\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_text_list_columns_order_idx\` ON \`home_pages_blocks_image_text_list_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_text_list_columns_parent_id_idx\` ON \`home_pages_blocks_image_text_list_columns\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_text_list_columns_image_idx\` ON \`home_pages_blocks_image_text_list_columns\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_image_text_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`layout\` text DEFAULT 'above',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_text_list_order_idx\` ON \`home_pages_blocks_image_text_list\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_text_list_parent_id_idx\` ON \`home_pages_blocks_image_text_list\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_text_list_path_idx\` ON \`home_pages_blocks_image_text_list\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_biography\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`biography_id\` integer,
  	\`image_layout\` text DEFAULT 'left',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`biography_id\`) REFERENCES \`biographies\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_biography_order_idx\` ON \`_home_pages_v_blocks_biography\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_biography_parent_id_idx\` ON \`_home_pages_v_blocks_biography\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_biography_path_idx\` ON \`_home_pages_v_blocks_biography\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_biography_biography_idx\` ON \`_home_pages_v_blocks_biography\` (\`biography_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_image_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`quote\` text,
  	\`author\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_quote_order_idx\` ON \`_home_pages_v_blocks_image_quote\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_quote_parent_id_idx\` ON \`_home_pages_v_blocks_image_quote\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_quote_path_idx\` ON \`_home_pages_v_blocks_image_quote\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_quote_image_idx\` ON \`_home_pages_v_blocks_image_quote\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_image_text_list_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`rich_text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v_blocks_image_text_list\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_text_list_columns_order_idx\` ON \`_home_pages_v_blocks_image_text_list_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_text_list_columns_parent_id_idx\` ON \`_home_pages_v_blocks_image_text_list_columns\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_text_list_columns_image_idx\` ON \`_home_pages_v_blocks_image_text_list_columns\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_image_text_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`layout\` text DEFAULT 'above',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_text_list_order_idx\` ON \`_home_pages_v_blocks_image_text_list\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_text_list_parent_id_idx\` ON \`_home_pages_v_blocks_image_text_list\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_text_list_path_idx\` ON \`_home_pages_v_blocks_image_text_list\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_biography\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`biography_id\` integer,
  	\`image_layout\` text DEFAULT 'left',
  	\`block_name\` text,
  	FOREIGN KEY (\`biography_id\`) REFERENCES \`biographies\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_biography_order_idx\` ON \`pages_blocks_biography\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_biography_parent_id_idx\` ON \`pages_blocks_biography\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_biography_path_idx\` ON \`pages_blocks_biography\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_biography_biography_idx\` ON \`pages_blocks_biography\` (\`biography_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_image_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`quote\` text,
  	\`author\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_quote_order_idx\` ON \`pages_blocks_image_quote\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_quote_parent_id_idx\` ON \`pages_blocks_image_quote\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_quote_path_idx\` ON \`pages_blocks_image_quote\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_quote_image_idx\` ON \`pages_blocks_image_quote\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_image_text_list_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`rich_text\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_image_text_list\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_list_columns_order_idx\` ON \`pages_blocks_image_text_list_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_list_columns_parent_id_idx\` ON \`pages_blocks_image_text_list_columns\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_list_columns_image_idx\` ON \`pages_blocks_image_text_list_columns\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_image_text_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`layout\` text DEFAULT 'above',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_list_order_idx\` ON \`pages_blocks_image_text_list\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_list_parent_id_idx\` ON \`pages_blocks_image_text_list\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_list_path_idx\` ON \`pages_blocks_image_text_list\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_biography\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`biography_id\` integer,
  	\`image_layout\` text DEFAULT 'left',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`biography_id\`) REFERENCES \`biographies\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_biography_order_idx\` ON \`_pages_v_blocks_biography\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_biography_parent_id_idx\` ON \`_pages_v_blocks_biography\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_biography_path_idx\` ON \`_pages_v_blocks_biography\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_biography_biography_idx\` ON \`_pages_v_blocks_biography\` (\`biography_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_image_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`quote\` text,
  	\`author\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_quote_order_idx\` ON \`_pages_v_blocks_image_quote\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_quote_parent_id_idx\` ON \`_pages_v_blocks_image_quote\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_quote_path_idx\` ON \`_pages_v_blocks_image_quote\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_quote_image_idx\` ON \`_pages_v_blocks_image_quote\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_image_text_list_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`rich_text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_image_text_list\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_list_columns_order_idx\` ON \`_pages_v_blocks_image_text_list_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_list_columns_parent_id_idx\` ON \`_pages_v_blocks_image_text_list_columns\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_list_columns_image_idx\` ON \`_pages_v_blocks_image_text_list_columns\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_image_text_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`layout\` text DEFAULT 'above',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_list_order_idx\` ON \`_pages_v_blocks_image_text_list\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_list_parent_id_idx\` ON \`_pages_v_blocks_image_text_list\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_list_path_idx\` ON \`_pages_v_blocks_image_text_list\` (\`_path\`);`,
  )
}
