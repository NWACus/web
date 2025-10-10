import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_biography\` (
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
    sql`INSERT INTO \`__new_home_pages_blocks_biography\`("_order", "_parent_id", "_path", "id", "background_color", "biography_id", "image_layout", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "biography_id", "image_layout", "block_name" FROM \`home_pages_blocks_biography\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_biography\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_biography\` RENAME TO \`home_pages_blocks_biography\`;`,
  )
  await db.run(sql`PRAGMA foreign_keys=ON;`)
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
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`layout\` text DEFAULT '1_1',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "layout", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "layout", "block_name" FROM \`home_pages_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_content\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_content\` RENAME TO \`home_pages_blocks_content\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_order_idx\` ON \`home_pages_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_parent_id_idx\` ON \`home_pages_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_path_idx\` ON \`home_pages_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_header_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`wrap_in_container\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_blocks_header_block\`("_order", "_parent_id", "_path", "id", "rich_text", "background_color", "wrap_in_container", "block_name") SELECT "_order", "_parent_id", "_path", "id", "rich_text", "background_color", "wrap_in_container", "block_name" FROM \`home_pages_blocks_header_block\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_header_block\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_header_block\` RENAME TO \`home_pages_blocks_header_block\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_header_block_order_idx\` ON \`home_pages_blocks_header_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_header_block_parent_id_idx\` ON \`home_pages_blocks_header_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_header_block_path_idx\` ON \`home_pages_blocks_header_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_image_quote\` (
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
    sql`INSERT INTO \`__new_home_pages_blocks_image_quote\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "block_name" FROM \`home_pages_blocks_image_quote\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_image_quote\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_image_quote\` RENAME TO \`home_pages_blocks_image_quote\`;`,
  )
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
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_image_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`rich_text\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_blocks_image_text\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "block_name" FROM \`home_pages_blocks_image_text\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_image_text\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_image_text\` RENAME TO \`home_pages_blocks_image_text\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_text_order_idx\` ON \`home_pages_blocks_image_text\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_text_parent_id_idx\` ON \`home_pages_blocks_image_text\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_text_path_idx\` ON \`home_pages_blocks_image_text\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_text_image_idx\` ON \`home_pages_blocks_image_text\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_link_preview\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`header\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_blocks_link_preview\`("_order", "_parent_id", "_path", "id", "header", "background_color", "block_name") SELECT "_order", "_parent_id", "_path", "id", "header", "background_color", "block_name" FROM \`home_pages_blocks_link_preview\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_link_preview\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_link_preview\` RENAME TO \`home_pages_blocks_link_preview\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_order_idx\` ON \`home_pages_blocks_link_preview\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_parent_id_idx\` ON \`home_pages_blocks_link_preview\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_path_idx\` ON \`home_pages_blocks_link_preview\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_home_pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`tenant_id\` integer,
  	\`highlighted_content_enabled\` integer DEFAULT false,
  	\`highlighted_content_heading\` text,
  	\`highlighted_content_background_color\` text DEFAULT 'transparent',
  	\`published_at\` text,
  	\`content_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages\`("id", "tenant_id", "highlighted_content_enabled", "highlighted_content_heading", "highlighted_content_background_color", "published_at", "content_hash", "updated_at", "created_at", "_status") SELECT "id", "tenant_id", "highlighted_content_enabled", "highlighted_content_heading", "highlighted_content_background_color", "published_at", "content_hash", "updated_at", "created_at", "_status" FROM \`home_pages\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages\`;`)
  await db.run(sql`ALTER TABLE \`__new_home_pages\` RENAME TO \`home_pages\`;`)
  await db.run(
    sql`CREATE UNIQUE INDEX \`home_pages_tenant_idx\` ON \`home_pages\` (\`tenant_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`home_pages_updated_at_idx\` ON \`home_pages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`home_pages_created_at_idx\` ON \`home_pages\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`home_pages__status_idx\` ON \`home_pages\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_biography\` (
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
    sql`INSERT INTO \`__new__home_pages_v_blocks_biography\`("_order", "_parent_id", "_path", "id", "background_color", "biography_id", "image_layout", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "biography_id", "image_layout", "_uuid", "block_name" FROM \`_home_pages_v_blocks_biography\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_biography\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_biography\` RENAME TO \`_home_pages_v_blocks_biography\`;`,
  )
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
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`layout\` text DEFAULT '1_1',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "layout", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "layout", "_uuid", "block_name" FROM \`_home_pages_v_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_content\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_content\` RENAME TO \`_home_pages_v_blocks_content\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_order_idx\` ON \`_home_pages_v_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_parent_id_idx\` ON \`_home_pages_v_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_path_idx\` ON \`_home_pages_v_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_header_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`wrap_in_container\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_blocks_header_block\`("_order", "_parent_id", "_path", "id", "rich_text", "background_color", "wrap_in_container", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "rich_text", "background_color", "wrap_in_container", "_uuid", "block_name" FROM \`_home_pages_v_blocks_header_block\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_header_block\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_header_block\` RENAME TO \`_home_pages_v_blocks_header_block\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_header_block_order_idx\` ON \`_home_pages_v_blocks_header_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_header_block_parent_id_idx\` ON \`_home_pages_v_blocks_header_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_header_block_path_idx\` ON \`_home_pages_v_blocks_header_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_image_quote\` (
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
    sql`INSERT INTO \`__new__home_pages_v_blocks_image_quote\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "_uuid", "block_name" FROM \`_home_pages_v_blocks_image_quote\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_image_quote\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_image_quote\` RENAME TO \`_home_pages_v_blocks_image_quote\`;`,
  )
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
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_image_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`rich_text\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_blocks_image_text\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "_uuid", "block_name" FROM \`_home_pages_v_blocks_image_text\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_image_text\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_image_text\` RENAME TO \`_home_pages_v_blocks_image_text\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_text_order_idx\` ON \`_home_pages_v_blocks_image_text\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_text_parent_id_idx\` ON \`_home_pages_v_blocks_image_text\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_text_path_idx\` ON \`_home_pages_v_blocks_image_text\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_text_image_idx\` ON \`_home_pages_v_blocks_image_text\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_link_preview\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`header\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_blocks_link_preview\`("_order", "_parent_id", "_path", "id", "header", "background_color", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "header", "background_color", "_uuid", "block_name" FROM \`_home_pages_v_blocks_link_preview\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_link_preview\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_link_preview\` RENAME TO \`_home_pages_v_blocks_link_preview\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_order_idx\` ON \`_home_pages_v_blocks_link_preview\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_parent_id_idx\` ON \`_home_pages_v_blocks_link_preview\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_path_idx\` ON \`_home_pages_v_blocks_link_preview\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_tenant_id\` integer,
  	\`version_highlighted_content_enabled\` integer DEFAULT false,
  	\`version_highlighted_content_heading\` text,
  	\`version_highlighted_content_background_color\` text DEFAULT 'transparent',
  	\`version_published_at\` text,
  	\`version_content_hash\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v\`("id", "parent_id", "version_tenant_id", "version_highlighted_content_enabled", "version_highlighted_content_heading", "version_highlighted_content_background_color", "version_published_at", "version_content_hash", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "latest", "autosave") SELECT "id", "parent_id", "version_tenant_id", "version_highlighted_content_enabled", "version_highlighted_content_heading", "version_highlighted_content_background_color", "version_published_at", "version_content_hash", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "latest", "autosave" FROM \`_home_pages_v\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v\`;`)
  await db.run(sql`ALTER TABLE \`__new__home_pages_v\` RENAME TO \`_home_pages_v\`;`)
  await db.run(sql`CREATE INDEX \`_home_pages_v_parent_idx\` ON \`_home_pages_v\` (\`parent_id\`);`)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_version_tenant_idx\` ON \`_home_pages_v\` (\`version_tenant_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_version_updated_at_idx\` ON \`_home_pages_v\` (\`version_updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_version_created_at_idx\` ON \`_home_pages_v\` (\`version_created_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_version__status_idx\` ON \`_home_pages_v\` (\`version__status\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_created_at_idx\` ON \`_home_pages_v\` (\`created_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_updated_at_idx\` ON \`_home_pages_v\` (\`updated_at\`);`,
  )
  await db.run(sql`CREATE INDEX \`_home_pages_v_latest_idx\` ON \`_home_pages_v\` (\`latest\`);`)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_autosave_idx\` ON \`_home_pages_v\` (\`autosave\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_biography\` (
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
    sql`INSERT INTO \`__new_pages_blocks_biography\`("_order", "_parent_id", "_path", "id", "background_color", "biography_id", "image_layout", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "biography_id", "image_layout", "block_name" FROM \`pages_blocks_biography\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_biography\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_biography\` RENAME TO \`pages_blocks_biography\`;`,
  )
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
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_blog_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`sort_by\` text DEFAULT '-publishedAt',
  	\`max_posts\` numeric DEFAULT 4,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_blog_list\`("_order", "_parent_id", "_path", "id", "heading", "below_heading_content", "background_color", "sort_by", "max_posts", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "below_heading_content", "background_color", "sort_by", "max_posts", "block_name" FROM \`pages_blocks_blog_list\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_blog_list\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_blog_list\` RENAME TO \`pages_blocks_blog_list\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_blog_list_order_idx\` ON \`pages_blocks_blog_list\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_blog_list_parent_id_idx\` ON \`pages_blocks_blog_list\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_blog_list_path_idx\` ON \`pages_blocks_blog_list\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`layout\` text DEFAULT '1_1',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "layout", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "layout", "block_name" FROM \`pages_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_content\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_content\` RENAME TO \`pages_blocks_content\`;`)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_order_idx\` ON \`pages_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_parent_id_idx\` ON \`pages_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_path_idx\` ON \`pages_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_header_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`wrap_in_container\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_header_block\`("_order", "_parent_id", "_path", "id", "rich_text", "background_color", "wrap_in_container", "block_name") SELECT "_order", "_parent_id", "_path", "id", "rich_text", "background_color", "wrap_in_container", "block_name" FROM \`pages_blocks_header_block\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_header_block\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_header_block\` RENAME TO \`pages_blocks_header_block\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_header_block_order_idx\` ON \`pages_blocks_header_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_header_block_parent_id_idx\` ON \`pages_blocks_header_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_header_block_path_idx\` ON \`pages_blocks_header_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_image_quote\` (
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
    sql`INSERT INTO \`__new_pages_blocks_image_quote\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "block_name" FROM \`pages_blocks_image_quote\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_image_quote\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_image_quote\` RENAME TO \`pages_blocks_image_quote\`;`,
  )
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
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_image_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`rich_text\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_image_text\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "block_name" FROM \`pages_blocks_image_text\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_image_text\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_image_text\` RENAME TO \`pages_blocks_image_text\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_order_idx\` ON \`pages_blocks_image_text\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_parent_id_idx\` ON \`pages_blocks_image_text\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_path_idx\` ON \`pages_blocks_image_text\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_image_idx\` ON \`pages_blocks_image_text\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_link_preview\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`header\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_link_preview\`("_order", "_parent_id", "_path", "id", "header", "background_color", "block_name") SELECT "_order", "_parent_id", "_path", "id", "header", "background_color", "block_name" FROM \`pages_blocks_link_preview\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_link_preview\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_link_preview\` RENAME TO \`pages_blocks_link_preview\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_link_preview_order_idx\` ON \`pages_blocks_link_preview\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_link_preview_parent_id_idx\` ON \`pages_blocks_link_preview\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_link_preview_path_idx\` ON \`pages_blocks_link_preview\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_single_blog_post\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`post_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_single_blog_post\`("_order", "_parent_id", "_path", "id", "background_color", "post_id", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "post_id", "block_name" FROM \`pages_blocks_single_blog_post\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_single_blog_post\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_single_blog_post\` RENAME TO \`pages_blocks_single_blog_post\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_single_blog_post_order_idx\` ON \`pages_blocks_single_blog_post\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_single_blog_post_parent_id_idx\` ON \`pages_blocks_single_blog_post\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_single_blog_post_path_idx\` ON \`pages_blocks_single_blog_post\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_single_blog_post_post_idx\` ON \`pages_blocks_single_blog_post\` (\`post_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_sponsors_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_sponsors_block\`("_order", "_parent_id", "_path", "id", "title", "background_color", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "background_color", "block_name" FROM \`pages_blocks_sponsors_block\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_sponsors_block\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_sponsors_block\` RENAME TO \`pages_blocks_sponsors_block\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_sponsors_block_order_idx\` ON \`pages_blocks_sponsors_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_sponsors_block_parent_id_idx\` ON \`pages_blocks_sponsors_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_sponsors_block_path_idx\` ON \`pages_blocks_sponsors_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_generic_embed\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`html\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`align_content\` text DEFAULT 'left',
  	\`embed_height\` numeric,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_generic_embed\`("_order", "_parent_id", "_path", "id", "html", "background_color", "align_content", "block_name") SELECT "_order", "_parent_id", "_path", "id", "html", "background_color", "align_content", "block_name" FROM \`pages_blocks_generic_embed\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_generic_embed\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_generic_embed\` RENAME TO \`pages_blocks_generic_embed\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_generic_embed_order_idx\` ON \`pages_blocks_generic_embed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_generic_embed_parent_id_idx\` ON \`pages_blocks_generic_embed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_generic_embed_path_idx\` ON \`pages_blocks_generic_embed\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_biography\` (
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
    sql`INSERT INTO \`__new__pages_v_blocks_biography\`("_order", "_parent_id", "_path", "id", "background_color", "biography_id", "image_layout", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "biography_id", "image_layout", "_uuid", "block_name" FROM \`_pages_v_blocks_biography\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_biography\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_biography\` RENAME TO \`_pages_v_blocks_biography\`;`,
  )
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
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_blog_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`sort_by\` text DEFAULT '-publishedAt',
  	\`max_posts\` numeric DEFAULT 4,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_blog_list\`("_order", "_parent_id", "_path", "id", "heading", "below_heading_content", "background_color", "sort_by", "max_posts", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "below_heading_content", "background_color", "sort_by", "max_posts", "_uuid", "block_name" FROM \`_pages_v_blocks_blog_list\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_blog_list\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_blog_list\` RENAME TO \`_pages_v_blocks_blog_list\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_blog_list_order_idx\` ON \`_pages_v_blocks_blog_list\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_blog_list_parent_id_idx\` ON \`_pages_v_blocks_blog_list\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_blog_list_path_idx\` ON \`_pages_v_blocks_blog_list\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`layout\` text DEFAULT '1_1',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "layout", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "layout", "_uuid", "block_name" FROM \`_pages_v_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_content\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_content\` RENAME TO \`_pages_v_blocks_content\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_order_idx\` ON \`_pages_v_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_parent_id_idx\` ON \`_pages_v_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_path_idx\` ON \`_pages_v_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_header_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`wrap_in_container\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_header_block\`("_order", "_parent_id", "_path", "id", "rich_text", "background_color", "wrap_in_container", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "rich_text", "background_color", "wrap_in_container", "_uuid", "block_name" FROM \`_pages_v_blocks_header_block\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_header_block\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_header_block\` RENAME TO \`_pages_v_blocks_header_block\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_header_block_order_idx\` ON \`_pages_v_blocks_header_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_header_block_parent_id_idx\` ON \`_pages_v_blocks_header_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_header_block_path_idx\` ON \`_pages_v_blocks_header_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_image_quote\` (
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
    sql`INSERT INTO \`__new__pages_v_blocks_image_quote\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "_uuid", "block_name" FROM \`_pages_v_blocks_image_quote\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_image_quote\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_image_quote\` RENAME TO \`_pages_v_blocks_image_quote\`;`,
  )
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
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_image_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`rich_text\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_image_text\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "_uuid", "block_name" FROM \`_pages_v_blocks_image_text\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_image_text\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_image_text\` RENAME TO \`_pages_v_blocks_image_text\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_order_idx\` ON \`_pages_v_blocks_image_text\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_parent_id_idx\` ON \`_pages_v_blocks_image_text\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_path_idx\` ON \`_pages_v_blocks_image_text\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_image_idx\` ON \`_pages_v_blocks_image_text\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_link_preview\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`header\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_link_preview\`("_order", "_parent_id", "_path", "id", "header", "background_color", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "header", "background_color", "_uuid", "block_name" FROM \`_pages_v_blocks_link_preview\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_link_preview\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_link_preview\` RENAME TO \`_pages_v_blocks_link_preview\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_link_preview_order_idx\` ON \`_pages_v_blocks_link_preview\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_link_preview_parent_id_idx\` ON \`_pages_v_blocks_link_preview\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_link_preview_path_idx\` ON \`_pages_v_blocks_link_preview\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_single_blog_post\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`post_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_single_blog_post\`("_order", "_parent_id", "_path", "id", "background_color", "post_id", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "post_id", "_uuid", "block_name" FROM \`_pages_v_blocks_single_blog_post\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_single_blog_post\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_single_blog_post\` RENAME TO \`_pages_v_blocks_single_blog_post\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_single_blog_post_order_idx\` ON \`_pages_v_blocks_single_blog_post\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_single_blog_post_parent_id_idx\` ON \`_pages_v_blocks_single_blog_post\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_single_blog_post_path_idx\` ON \`_pages_v_blocks_single_blog_post\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_single_blog_post_post_idx\` ON \`_pages_v_blocks_single_blog_post\` (\`post_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_sponsors_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_sponsors_block\`("_order", "_parent_id", "_path", "id", "title", "background_color", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "background_color", "_uuid", "block_name" FROM \`_pages_v_blocks_sponsors_block\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_sponsors_block\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_sponsors_block\` RENAME TO \`_pages_v_blocks_sponsors_block\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_sponsors_block_order_idx\` ON \`_pages_v_blocks_sponsors_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_sponsors_block_parent_id_idx\` ON \`_pages_v_blocks_sponsors_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_sponsors_block_path_idx\` ON \`_pages_v_blocks_sponsors_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_generic_embed\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`html\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`align_content\` text DEFAULT 'left',
  	\`embed_height\` numeric,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_generic_embed\`("_order", "_parent_id", "_path", "id", "html", "background_color", "align_content", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "html", "background_color", "align_content", "_uuid", "block_name" FROM \`_pages_v_blocks_generic_embed\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_generic_embed\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_generic_embed\` RENAME TO \`_pages_v_blocks_generic_embed\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_generic_embed_order_idx\` ON \`_pages_v_blocks_generic_embed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_generic_embed_parent_id_idx\` ON \`_pages_v_blocks_generic_embed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_generic_embed_path_idx\` ON \`_pages_v_blocks_generic_embed\` (\`_path\`);`,
  )
  await db.run(sql`ALTER TABLE \`settings\` ADD \`footer_form_embed_height\` numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_biography\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`biography_id\` integer,
  	\`image_layout\` text DEFAULT 'left',
  	\`block_name\` text,
  	FOREIGN KEY (\`biography_id\`) REFERENCES \`biographies\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_blocks_biography\`("_order", "_parent_id", "_path", "id", "background_color", "biography_id", "image_layout", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "biography_id", "image_layout", "block_name" FROM \`home_pages_blocks_biography\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_biography\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_biography\` RENAME TO \`home_pages_blocks_biography\`;`,
  )
  await db.run(sql`PRAGMA foreign_keys=ON;`)
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
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`layout\` text DEFAULT '1_1',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "layout", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "layout", "block_name" FROM \`home_pages_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_content\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_content\` RENAME TO \`home_pages_blocks_content\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_order_idx\` ON \`home_pages_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_parent_id_idx\` ON \`home_pages_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_path_idx\` ON \`home_pages_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_header_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	\`background_color\` text DEFAULT 'white',
  	\`wrap_in_container\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_blocks_header_block\`("_order", "_parent_id", "_path", "id", "rich_text", "background_color", "wrap_in_container", "block_name") SELECT "_order", "_parent_id", "_path", "id", "rich_text", "background_color", "wrap_in_container", "block_name" FROM \`home_pages_blocks_header_block\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_header_block\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_header_block\` RENAME TO \`home_pages_blocks_header_block\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_header_block_order_idx\` ON \`home_pages_blocks_header_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_header_block_parent_id_idx\` ON \`home_pages_blocks_header_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_header_block_path_idx\` ON \`home_pages_blocks_header_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_image_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
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
    sql`INSERT INTO \`__new_home_pages_blocks_image_quote\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "block_name" FROM \`home_pages_blocks_image_quote\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_image_quote\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_image_quote\` RENAME TO \`home_pages_blocks_image_quote\`;`,
  )
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
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_image_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`rich_text\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_blocks_image_text\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "block_name" FROM \`home_pages_blocks_image_text\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_image_text\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_image_text\` RENAME TO \`home_pages_blocks_image_text\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_text_order_idx\` ON \`home_pages_blocks_image_text\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_text_parent_id_idx\` ON \`home_pages_blocks_image_text\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_text_path_idx\` ON \`home_pages_blocks_image_text\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_text_image_idx\` ON \`home_pages_blocks_image_text\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_link_preview\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`header\` text,
  	\`background_color\` text DEFAULT 'white',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_blocks_link_preview\`("_order", "_parent_id", "_path", "id", "header", "background_color", "block_name") SELECT "_order", "_parent_id", "_path", "id", "header", "background_color", "block_name" FROM \`home_pages_blocks_link_preview\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_link_preview\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_link_preview\` RENAME TO \`home_pages_blocks_link_preview\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_order_idx\` ON \`home_pages_blocks_link_preview\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_parent_id_idx\` ON \`home_pages_blocks_link_preview\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_path_idx\` ON \`home_pages_blocks_link_preview\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_home_pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`tenant_id\` integer,
  	\`highlighted_content_enabled\` integer DEFAULT false,
  	\`highlighted_content_heading\` text,
  	\`highlighted_content_background_color\` text DEFAULT 'white',
  	\`published_at\` text,
  	\`content_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages\`("id", "tenant_id", "highlighted_content_enabled", "highlighted_content_heading", "highlighted_content_background_color", "published_at", "content_hash", "updated_at", "created_at", "_status") SELECT "id", "tenant_id", "highlighted_content_enabled", "highlighted_content_heading", "highlighted_content_background_color", "published_at", "content_hash", "updated_at", "created_at", "_status" FROM \`home_pages\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages\`;`)
  await db.run(sql`ALTER TABLE \`__new_home_pages\` RENAME TO \`home_pages\`;`)
  await db.run(
    sql`CREATE UNIQUE INDEX \`home_pages_tenant_idx\` ON \`home_pages\` (\`tenant_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`home_pages_updated_at_idx\` ON \`home_pages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`home_pages_created_at_idx\` ON \`home_pages\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`home_pages__status_idx\` ON \`home_pages\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_biography\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`biography_id\` integer,
  	\`image_layout\` text DEFAULT 'left',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`biography_id\`) REFERENCES \`biographies\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_blocks_biography\`("_order", "_parent_id", "_path", "id", "background_color", "biography_id", "image_layout", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "biography_id", "image_layout", "_uuid", "block_name" FROM \`_home_pages_v_blocks_biography\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_biography\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_biography\` RENAME TO \`_home_pages_v_blocks_biography\`;`,
  )
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
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`layout\` text DEFAULT '1_1',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "layout", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "layout", "_uuid", "block_name" FROM \`_home_pages_v_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_content\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_content\` RENAME TO \`_home_pages_v_blocks_content\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_order_idx\` ON \`_home_pages_v_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_parent_id_idx\` ON \`_home_pages_v_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_path_idx\` ON \`_home_pages_v_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_header_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	\`background_color\` text DEFAULT 'white',
  	\`wrap_in_container\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_blocks_header_block\`("_order", "_parent_id", "_path", "id", "rich_text", "background_color", "wrap_in_container", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "rich_text", "background_color", "wrap_in_container", "_uuid", "block_name" FROM \`_home_pages_v_blocks_header_block\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_header_block\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_header_block\` RENAME TO \`_home_pages_v_blocks_header_block\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_header_block_order_idx\` ON \`_home_pages_v_blocks_header_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_header_block_parent_id_idx\` ON \`_home_pages_v_blocks_header_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_header_block_path_idx\` ON \`_home_pages_v_blocks_header_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_image_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
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
    sql`INSERT INTO \`__new__home_pages_v_blocks_image_quote\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "_uuid", "block_name" FROM \`_home_pages_v_blocks_image_quote\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_image_quote\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_image_quote\` RENAME TO \`_home_pages_v_blocks_image_quote\`;`,
  )
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
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_image_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`rich_text\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_blocks_image_text\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "_uuid", "block_name" FROM \`_home_pages_v_blocks_image_text\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_image_text\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_image_text\` RENAME TO \`_home_pages_v_blocks_image_text\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_text_order_idx\` ON \`_home_pages_v_blocks_image_text\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_text_parent_id_idx\` ON \`_home_pages_v_blocks_image_text\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_text_path_idx\` ON \`_home_pages_v_blocks_image_text\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_text_image_idx\` ON \`_home_pages_v_blocks_image_text\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_link_preview\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`header\` text,
  	\`background_color\` text DEFAULT 'white',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_blocks_link_preview\`("_order", "_parent_id", "_path", "id", "header", "background_color", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "header", "background_color", "_uuid", "block_name" FROM \`_home_pages_v_blocks_link_preview\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_link_preview\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_link_preview\` RENAME TO \`_home_pages_v_blocks_link_preview\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_order_idx\` ON \`_home_pages_v_blocks_link_preview\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_parent_id_idx\` ON \`_home_pages_v_blocks_link_preview\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_path_idx\` ON \`_home_pages_v_blocks_link_preview\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_tenant_id\` integer,
  	\`version_highlighted_content_enabled\` integer DEFAULT false,
  	\`version_highlighted_content_heading\` text,
  	\`version_highlighted_content_background_color\` text DEFAULT 'white',
  	\`version_published_at\` text,
  	\`version_content_hash\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v\`("id", "parent_id", "version_tenant_id", "version_highlighted_content_enabled", "version_highlighted_content_heading", "version_highlighted_content_background_color", "version_published_at", "version_content_hash", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "latest", "autosave") SELECT "id", "parent_id", "version_tenant_id", "version_highlighted_content_enabled", "version_highlighted_content_heading", "version_highlighted_content_background_color", "version_published_at", "version_content_hash", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "latest", "autosave" FROM \`_home_pages_v\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v\`;`)
  await db.run(sql`ALTER TABLE \`__new__home_pages_v\` RENAME TO \`_home_pages_v\`;`)
  await db.run(sql`CREATE INDEX \`_home_pages_v_parent_idx\` ON \`_home_pages_v\` (\`parent_id\`);`)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_version_tenant_idx\` ON \`_home_pages_v\` (\`version_tenant_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_version_updated_at_idx\` ON \`_home_pages_v\` (\`version_updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_version_created_at_idx\` ON \`_home_pages_v\` (\`version_created_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_version__status_idx\` ON \`_home_pages_v\` (\`version__status\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_created_at_idx\` ON \`_home_pages_v\` (\`created_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_updated_at_idx\` ON \`_home_pages_v\` (\`updated_at\`);`,
  )
  await db.run(sql`CREATE INDEX \`_home_pages_v_latest_idx\` ON \`_home_pages_v\` (\`latest\`);`)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_autosave_idx\` ON \`_home_pages_v\` (\`autosave\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_biography\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`biography_id\` integer,
  	\`image_layout\` text DEFAULT 'left',
  	\`block_name\` text,
  	FOREIGN KEY (\`biography_id\`) REFERENCES \`biographies\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_biography\`("_order", "_parent_id", "_path", "id", "background_color", "biography_id", "image_layout", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "biography_id", "image_layout", "block_name" FROM \`pages_blocks_biography\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_biography\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_biography\` RENAME TO \`pages_blocks_biography\`;`,
  )
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
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_blog_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`background_color\` text DEFAULT 'white',
  	\`sort_by\` text DEFAULT '-publishedAt',
  	\`max_posts\` numeric DEFAULT 4,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_blog_list\`("_order", "_parent_id", "_path", "id", "heading", "below_heading_content", "background_color", "sort_by", "max_posts", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "below_heading_content", "background_color", "sort_by", "max_posts", "block_name" FROM \`pages_blocks_blog_list\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_blog_list\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_blog_list\` RENAME TO \`pages_blocks_blog_list\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_blog_list_order_idx\` ON \`pages_blocks_blog_list\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_blog_list_parent_id_idx\` ON \`pages_blocks_blog_list\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_blog_list_path_idx\` ON \`pages_blocks_blog_list\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`layout\` text DEFAULT '1_1',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "layout", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "layout", "block_name" FROM \`pages_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_content\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_content\` RENAME TO \`pages_blocks_content\`;`)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_order_idx\` ON \`pages_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_parent_id_idx\` ON \`pages_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_path_idx\` ON \`pages_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_header_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	\`background_color\` text DEFAULT 'white',
  	\`wrap_in_container\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_header_block\`("_order", "_parent_id", "_path", "id", "rich_text", "background_color", "wrap_in_container", "block_name") SELECT "_order", "_parent_id", "_path", "id", "rich_text", "background_color", "wrap_in_container", "block_name" FROM \`pages_blocks_header_block\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_header_block\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_header_block\` RENAME TO \`pages_blocks_header_block\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_header_block_order_idx\` ON \`pages_blocks_header_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_header_block_parent_id_idx\` ON \`pages_blocks_header_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_header_block_path_idx\` ON \`pages_blocks_header_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_image_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
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
    sql`INSERT INTO \`__new_pages_blocks_image_quote\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "block_name" FROM \`pages_blocks_image_quote\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_image_quote\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_image_quote\` RENAME TO \`pages_blocks_image_quote\`;`,
  )
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
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_image_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`rich_text\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_image_text\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "block_name" FROM \`pages_blocks_image_text\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_image_text\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_image_text\` RENAME TO \`pages_blocks_image_text\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_order_idx\` ON \`pages_blocks_image_text\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_parent_id_idx\` ON \`pages_blocks_image_text\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_path_idx\` ON \`pages_blocks_image_text\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_image_idx\` ON \`pages_blocks_image_text\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_link_preview\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`header\` text,
  	\`background_color\` text DEFAULT 'white',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_link_preview\`("_order", "_parent_id", "_path", "id", "header", "background_color", "block_name") SELECT "_order", "_parent_id", "_path", "id", "header", "background_color", "block_name" FROM \`pages_blocks_link_preview\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_link_preview\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_link_preview\` RENAME TO \`pages_blocks_link_preview\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_link_preview_order_idx\` ON \`pages_blocks_link_preview\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_link_preview_parent_id_idx\` ON \`pages_blocks_link_preview\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_link_preview_path_idx\` ON \`pages_blocks_link_preview\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_single_blog_post\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`post_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_single_blog_post\`("_order", "_parent_id", "_path", "id", "background_color", "post_id", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "post_id", "block_name" FROM \`pages_blocks_single_blog_post\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_single_blog_post\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_single_blog_post\` RENAME TO \`pages_blocks_single_blog_post\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_single_blog_post_order_idx\` ON \`pages_blocks_single_blog_post\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_single_blog_post_parent_id_idx\` ON \`pages_blocks_single_blog_post\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_single_blog_post_path_idx\` ON \`pages_blocks_single_blog_post\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_single_blog_post_post_idx\` ON \`pages_blocks_single_blog_post\` (\`post_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_sponsors_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`background_color\` text DEFAULT 'white',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_sponsors_block\`("_order", "_parent_id", "_path", "id", "title", "background_color", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "background_color", "block_name" FROM \`pages_blocks_sponsors_block\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_sponsors_block\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_sponsors_block\` RENAME TO \`pages_blocks_sponsors_block\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_sponsors_block_order_idx\` ON \`pages_blocks_sponsors_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_sponsors_block_parent_id_idx\` ON \`pages_blocks_sponsors_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_sponsors_block_path_idx\` ON \`pages_blocks_sponsors_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_generic_embed\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`html\` text,
  	\`background_color\` text DEFAULT 'white',
  	\`align_content\` text DEFAULT 'left',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_generic_embed\`("_order", "_parent_id", "_path", "id", "html", "background_color", "align_content", "block_name") SELECT "_order", "_parent_id", "_path", "id", "html", "background_color", "align_content", "block_name" FROM \`pages_blocks_generic_embed\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_generic_embed\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_generic_embed\` RENAME TO \`pages_blocks_generic_embed\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_generic_embed_order_idx\` ON \`pages_blocks_generic_embed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_generic_embed_parent_id_idx\` ON \`pages_blocks_generic_embed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_generic_embed_path_idx\` ON \`pages_blocks_generic_embed\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_biography\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`biography_id\` integer,
  	\`image_layout\` text DEFAULT 'left',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`biography_id\`) REFERENCES \`biographies\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_biography\`("_order", "_parent_id", "_path", "id", "background_color", "biography_id", "image_layout", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "biography_id", "image_layout", "_uuid", "block_name" FROM \`_pages_v_blocks_biography\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_biography\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_biography\` RENAME TO \`_pages_v_blocks_biography\`;`,
  )
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
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_blog_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`background_color\` text DEFAULT 'white',
  	\`sort_by\` text DEFAULT '-publishedAt',
  	\`max_posts\` numeric DEFAULT 4,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_blog_list\`("_order", "_parent_id", "_path", "id", "heading", "below_heading_content", "background_color", "sort_by", "max_posts", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "below_heading_content", "background_color", "sort_by", "max_posts", "_uuid", "block_name" FROM \`_pages_v_blocks_blog_list\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_blog_list\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_blog_list\` RENAME TO \`_pages_v_blocks_blog_list\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_blog_list_order_idx\` ON \`_pages_v_blocks_blog_list\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_blog_list_parent_id_idx\` ON \`_pages_v_blocks_blog_list\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_blog_list_path_idx\` ON \`_pages_v_blocks_blog_list\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`layout\` text DEFAULT '1_1',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "layout", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "layout", "_uuid", "block_name" FROM \`_pages_v_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_content\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_content\` RENAME TO \`_pages_v_blocks_content\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_order_idx\` ON \`_pages_v_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_parent_id_idx\` ON \`_pages_v_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_path_idx\` ON \`_pages_v_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_header_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	\`background_color\` text DEFAULT 'white',
  	\`wrap_in_container\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_header_block\`("_order", "_parent_id", "_path", "id", "rich_text", "background_color", "wrap_in_container", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "rich_text", "background_color", "wrap_in_container", "_uuid", "block_name" FROM \`_pages_v_blocks_header_block\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_header_block\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_header_block\` RENAME TO \`_pages_v_blocks_header_block\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_header_block_order_idx\` ON \`_pages_v_blocks_header_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_header_block_parent_id_idx\` ON \`_pages_v_blocks_header_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_header_block_path_idx\` ON \`_pages_v_blocks_header_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_image_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
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
    sql`INSERT INTO \`__new__pages_v_blocks_image_quote\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "_uuid", "block_name" FROM \`_pages_v_blocks_image_quote\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_image_quote\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_image_quote\` RENAME TO \`_pages_v_blocks_image_quote\`;`,
  )
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
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_image_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`rich_text\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_image_text\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "_uuid", "block_name" FROM \`_pages_v_blocks_image_text\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_image_text\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_image_text\` RENAME TO \`_pages_v_blocks_image_text\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_order_idx\` ON \`_pages_v_blocks_image_text\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_parent_id_idx\` ON \`_pages_v_blocks_image_text\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_path_idx\` ON \`_pages_v_blocks_image_text\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_image_idx\` ON \`_pages_v_blocks_image_text\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_link_preview\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`header\` text,
  	\`background_color\` text DEFAULT 'white',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_link_preview\`("_order", "_parent_id", "_path", "id", "header", "background_color", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "header", "background_color", "_uuid", "block_name" FROM \`_pages_v_blocks_link_preview\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_link_preview\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_link_preview\` RENAME TO \`_pages_v_blocks_link_preview\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_link_preview_order_idx\` ON \`_pages_v_blocks_link_preview\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_link_preview_parent_id_idx\` ON \`_pages_v_blocks_link_preview\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_link_preview_path_idx\` ON \`_pages_v_blocks_link_preview\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_single_blog_post\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`post_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_single_blog_post\`("_order", "_parent_id", "_path", "id", "background_color", "post_id", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "post_id", "_uuid", "block_name" FROM \`_pages_v_blocks_single_blog_post\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_single_blog_post\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_single_blog_post\` RENAME TO \`_pages_v_blocks_single_blog_post\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_single_blog_post_order_idx\` ON \`_pages_v_blocks_single_blog_post\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_single_blog_post_parent_id_idx\` ON \`_pages_v_blocks_single_blog_post\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_single_blog_post_path_idx\` ON \`_pages_v_blocks_single_blog_post\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_single_blog_post_post_idx\` ON \`_pages_v_blocks_single_blog_post\` (\`post_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_sponsors_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`background_color\` text DEFAULT 'white',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_sponsors_block\`("_order", "_parent_id", "_path", "id", "title", "background_color", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "background_color", "_uuid", "block_name" FROM \`_pages_v_blocks_sponsors_block\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_sponsors_block\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_sponsors_block\` RENAME TO \`_pages_v_blocks_sponsors_block\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_sponsors_block_order_idx\` ON \`_pages_v_blocks_sponsors_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_sponsors_block_parent_id_idx\` ON \`_pages_v_blocks_sponsors_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_sponsors_block_path_idx\` ON \`_pages_v_blocks_sponsors_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_generic_embed\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`html\` text,
  	\`background_color\` text DEFAULT 'white',
  	\`align_content\` text DEFAULT 'left',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_generic_embed\`("_order", "_parent_id", "_path", "id", "html", "background_color", "align_content", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "html", "background_color", "align_content", "_uuid", "block_name" FROM \`_pages_v_blocks_generic_embed\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_generic_embed\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_generic_embed\` RENAME TO \`_pages_v_blocks_generic_embed\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_generic_embed_order_idx\` ON \`_pages_v_blocks_generic_embed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_generic_embed_parent_id_idx\` ON \`_pages_v_blocks_generic_embed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_generic_embed_path_idx\` ON \`_pages_v_blocks_generic_embed\` (\`_path\`);`,
  )
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`footer_form_embed_height\`;`)
}
