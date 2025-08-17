import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`home_pages_quick_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`type\` text DEFAULT 'reference',
  	\`new_tab\` integer,
  	\`url\` text,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_quick_links_order_idx\` ON \`home_pages_quick_links\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_quick_links_parent_id_idx\` ON \`home_pages_quick_links\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_highlighted_content_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_highlighted_content_columns_order_idx\` ON \`home_pages_highlighted_content_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_highlighted_content_columns_parent_id_idx\` ON \`home_pages_highlighted_content_columns\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_biography\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`biography_id\` integer,
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
  await db.run(sql`CREATE TABLE \`home_pages_blocks_content_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages_blocks_content\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_columns_order_idx\` ON \`home_pages_blocks_content_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_columns_parent_id_idx\` ON \`home_pages_blocks_content_columns\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_order_idx\` ON \`home_pages_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_parent_id_idx\` ON \`home_pages_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_path_idx\` ON \`home_pages_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_content_with_callout\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	\`callout\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_with_callout_order_idx\` ON \`home_pages_blocks_content_with_callout\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_with_callout_parent_id_idx\` ON \`home_pages_blocks_content_with_callout\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_with_callout_path_idx\` ON \`home_pages_blocks_content_with_callout\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_form_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`form_id\` integer,
  	\`enable_intro\` integer,
  	\`intro_content\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`form_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_form_block_order_idx\` ON \`home_pages_blocks_form_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_form_block_parent_id_idx\` ON \`home_pages_blocks_form_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_form_block_path_idx\` ON \`home_pages_blocks_form_block\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_form_block_form_idx\` ON \`home_pages_blocks_form_block\` (\`form_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_image_link_grid_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`link_type\` text DEFAULT 'reference',
  	\`link_new_tab\` integer,
  	\`link_url\` text,
  	\`caption\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages_blocks_image_link_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_link_grid_columns_order_idx\` ON \`home_pages_blocks_image_link_grid_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_link_grid_columns_parent_id_idx\` ON \`home_pages_blocks_image_link_grid_columns\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_link_grid_columns_image_idx\` ON \`home_pages_blocks_image_link_grid_columns\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_image_link_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_link_grid_order_idx\` ON \`home_pages_blocks_image_link_grid\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_link_grid_parent_id_idx\` ON \`home_pages_blocks_image_link_grid\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_link_grid_path_idx\` ON \`home_pages_blocks_image_link_grid\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_image_quote\` (
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
  await db.run(sql`CREATE TABLE \`home_pages_blocks_image_text\` (
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
  await db.run(sql`CREATE TABLE \`home_pages_blocks_link_preview_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`text\` text,
  	\`button_type\` text DEFAULT 'reference',
  	\`button_new_tab\` integer,
  	\`button_url\` text,
  	\`button_label\` text,
  	\`button_appearance\` text DEFAULT 'default',
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages_blocks_link_preview\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_cards_order_idx\` ON \`home_pages_blocks_link_preview_cards\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_cards_parent_id_idx\` ON \`home_pages_blocks_link_preview_cards\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_cards_image_idx\` ON \`home_pages_blocks_link_preview_cards\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_link_preview\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_order_idx\` ON \`home_pages_blocks_link_preview\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_parent_id_idx\` ON \`home_pages_blocks_link_preview\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_path_idx\` ON \`home_pages_blocks_link_preview\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_media_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`media_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_media_block_order_idx\` ON \`home_pages_blocks_media_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_media_block_parent_id_idx\` ON \`home_pages_blocks_media_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_media_block_path_idx\` ON \`home_pages_blocks_media_block\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_media_block_media_idx\` ON \`home_pages_blocks_media_block\` (\`media_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_team\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`team_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_team_order_idx\` ON \`home_pages_blocks_team\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_team_parent_id_idx\` ON \`home_pages_blocks_team\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_team_path_idx\` ON \`home_pages_blocks_team\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_team_team_idx\` ON \`home_pages_blocks_team\` (\`team_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`tenant_id\` integer,
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
    sql`CREATE UNIQUE INDEX \`home_pages_tenant_idx\` ON \`home_pages\` (\`tenant_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`home_pages_updated_at_idx\` ON \`home_pages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`home_pages_created_at_idx\` ON \`home_pages\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`home_pages__status_idx\` ON \`home_pages\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`home_pages_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`posts_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`home_pages_rels_order_idx\` ON \`home_pages_rels\` (\`order\`);`)
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_parent_idx\` ON \`home_pages_rels\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`home_pages_rels_path_idx\` ON \`home_pages_rels\` (\`path\`);`)
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_pages_id_idx\` ON \`home_pages_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_posts_id_idx\` ON \`home_pages_rels\` (\`posts_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_version_quick_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`type\` text DEFAULT 'reference',
  	\`new_tab\` integer,
  	\`url\` text,
  	\`label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_quick_links_order_idx\` ON \`_home_pages_v_version_quick_links\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_quick_links_parent_id_idx\` ON \`_home_pages_v_version_quick_links\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_version_highlighted_content_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_highlighted_content_columns_order_idx\` ON \`_home_pages_v_version_highlighted_content_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_highlighted_content_columns_parent_id_idx\` ON \`_home_pages_v_version_highlighted_content_columns\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_biography\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`biography_id\` integer,
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
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_content_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v_blocks_content\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_columns_order_idx\` ON \`_home_pages_v_blocks_content_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_columns_parent_id_idx\` ON \`_home_pages_v_blocks_content_columns\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_order_idx\` ON \`_home_pages_v_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_parent_id_idx\` ON \`_home_pages_v_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_path_idx\` ON \`_home_pages_v_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_content_with_callout\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	\`callout\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_with_callout_order_idx\` ON \`_home_pages_v_blocks_content_with_callout\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_with_callout_parent_id_idx\` ON \`_home_pages_v_blocks_content_with_callout\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_with_callout_path_idx\` ON \`_home_pages_v_blocks_content_with_callout\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_form_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`form_id\` integer,
  	\`enable_intro\` integer,
  	\`intro_content\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`form_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_form_block_order_idx\` ON \`_home_pages_v_blocks_form_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_form_block_parent_id_idx\` ON \`_home_pages_v_blocks_form_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_form_block_path_idx\` ON \`_home_pages_v_blocks_form_block\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_form_block_form_idx\` ON \`_home_pages_v_blocks_form_block\` (\`form_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_image_link_grid_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`link_type\` text DEFAULT 'reference',
  	\`link_new_tab\` integer,
  	\`link_url\` text,
  	\`caption\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v_blocks_image_link_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_link_grid_columns_order_idx\` ON \`_home_pages_v_blocks_image_link_grid_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_link_grid_columns_parent_id_idx\` ON \`_home_pages_v_blocks_image_link_grid_columns\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_link_grid_columns_image_idx\` ON \`_home_pages_v_blocks_image_link_grid_columns\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_image_link_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_link_grid_order_idx\` ON \`_home_pages_v_blocks_image_link_grid\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_link_grid_parent_id_idx\` ON \`_home_pages_v_blocks_image_link_grid\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_link_grid_path_idx\` ON \`_home_pages_v_blocks_image_link_grid\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_image_quote\` (
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
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_image_text\` (
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
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_link_preview_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`text\` text,
  	\`button_type\` text DEFAULT 'reference',
  	\`button_new_tab\` integer,
  	\`button_url\` text,
  	\`button_label\` text,
  	\`button_appearance\` text DEFAULT 'default',
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v_blocks_link_preview\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_cards_order_idx\` ON \`_home_pages_v_blocks_link_preview_cards\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_cards_parent_id_idx\` ON \`_home_pages_v_blocks_link_preview_cards\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_cards_image_idx\` ON \`_home_pages_v_blocks_link_preview_cards\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_link_preview\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_order_idx\` ON \`_home_pages_v_blocks_link_preview\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_parent_id_idx\` ON \`_home_pages_v_blocks_link_preview\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_path_idx\` ON \`_home_pages_v_blocks_link_preview\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_media_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`media_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_media_block_order_idx\` ON \`_home_pages_v_blocks_media_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_media_block_parent_id_idx\` ON \`_home_pages_v_blocks_media_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_media_block_path_idx\` ON \`_home_pages_v_blocks_media_block\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_media_block_media_idx\` ON \`_home_pages_v_blocks_media_block\` (\`media_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_team\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`team_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_team_order_idx\` ON \`_home_pages_v_blocks_team\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_team_parent_id_idx\` ON \`_home_pages_v_blocks_team\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_team_path_idx\` ON \`_home_pages_v_blocks_team\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_team_team_idx\` ON \`_home_pages_v_blocks_team\` (\`team_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_tenant_id\` integer,
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
  await db.run(sql`CREATE TABLE \`_home_pages_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`posts_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_order_idx\` ON \`_home_pages_v_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_parent_idx\` ON \`_home_pages_v_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_path_idx\` ON \`_home_pages_v_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_pages_id_idx\` ON \`_home_pages_v_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_posts_id_idx\` ON \`_home_pages_v_rels\` (\`posts_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`home_pages_id\` integer REFERENCES home_pages(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_home_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`home_pages_id\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`home_pages_quick_links\`;`)
  await db.run(sql`DROP TABLE \`home_pages_highlighted_content_columns\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_biography\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_content_columns\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_content\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_content_with_callout\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_form_block\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_image_link_grid_columns\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_image_link_grid\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_image_quote\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_image_text\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_image_text_list_columns\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_image_text_list\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_link_preview_cards\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_link_preview\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_media_block\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_team\`;`)
  await db.run(sql`DROP TABLE \`home_pages\`;`)
  await db.run(sql`DROP TABLE \`home_pages_rels\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_version_quick_links\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_version_highlighted_content_columns\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_biography\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_content_columns\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_content\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_content_with_callout\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_form_block\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_image_link_grid_columns\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_image_link_grid\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_image_quote\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_image_text\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_image_text_list_columns\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_image_text_list\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_link_preview_cards\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_link_preview\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_media_block\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_team\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	\`pages_id\` integer,
  	\`posts_id\` integer,
  	\`users_id\` integer,
  	\`tenants_id\` integer,
  	\`roles_id\` integer,
  	\`role_assignments_id\` integer,
  	\`global_roles_id\` integer,
  	\`global_role_assignments_id\` integer,
  	\`navigations_id\` integer,
  	\`biographies_id\` integer,
  	\`teams_id\` integer,
  	\`settings_id\` integer,
  	\`tags_id\` integer,
  	\`redirects_id\` integer,
  	\`forms_id\` integer,
  	\`form_submissions_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tenants_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`roles_id\`) REFERENCES \`roles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`role_assignments_id\`) REFERENCES \`role_assignments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`global_roles_id\`) REFERENCES \`global_roles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`global_role_assignments_id\`) REFERENCES \`global_role_assignments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`navigations_id\`) REFERENCES \`navigations\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`biographies_id\`) REFERENCES \`biographies\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`teams_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`settings_id\`) REFERENCES \`settings\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`redirects_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`forms_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "media_id", "pages_id", "posts_id", "users_id", "tenants_id", "roles_id", "role_assignments_id", "global_roles_id", "global_role_assignments_id", "navigations_id", "biographies_id", "teams_id", "settings_id", "tags_id", "redirects_id", "forms_id", "form_submissions_id") SELECT "id", "order", "parent_id", "path", "media_id", "pages_id", "posts_id", "users_id", "tenants_id", "roles_id", "role_assignments_id", "global_roles_id", "global_role_assignments_id", "navigations_id", "biographies_id", "teams_id", "settings_id", "tags_id", "redirects_id", "forms_id", "form_submissions_id" FROM \`payload_locked_documents_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`,
  )
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`posts_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_tenants_id_idx\` ON \`payload_locked_documents_rels\` (\`tenants_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_roles_id_idx\` ON \`payload_locked_documents_rels\` (\`roles_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_role_assignments_id_idx\` ON \`payload_locked_documents_rels\` (\`role_assignments_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_global_roles_id_idx\` ON \`payload_locked_documents_rels\` (\`global_roles_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_global_role_assignments_id_idx\` ON \`payload_locked_documents_rels\` (\`global_role_assignments_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_navigations_id_idx\` ON \`payload_locked_documents_rels\` (\`navigations_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_biographies_id_idx\` ON \`payload_locked_documents_rels\` (\`biographies_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_teams_id_idx\` ON \`payload_locked_documents_rels\` (\`teams_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_settings_id_idx\` ON \`payload_locked_documents_rels\` (\`settings_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_tags_id_idx\` ON \`payload_locked_documents_rels\` (\`tags_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_redirects_id_idx\` ON \`payload_locked_documents_rels\` (\`redirects_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_forms_id_idx\` ON \`payload_locked_documents_rels\` (\`forms_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_form_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`form_submissions_id\`);`,
  )
}
