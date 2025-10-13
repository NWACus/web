import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`built_in_pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`url\` text NOT NULL,
  	\`tenant_id\` integer NOT NULL,
  	\`content_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`CREATE INDEX \`built_in_pages_tenant_idx\` ON \`built_in_pages\` (\`tenant_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`built_in_pages_updated_at_idx\` ON \`built_in_pages\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`built_in_pages_created_at_idx\` ON \`built_in_pages\` (\`created_at\`);`,
  )
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_home_pages_quick_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`type\` text DEFAULT 'internal',
  	\`new_tab\` integer,
  	\`url\` text,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_quick_links\`("_order", "_parent_id", "id", "type", "new_tab", "url", "label") SELECT "_order", "_parent_id", "id", "type", "new_tab", "url", "label" FROM \`home_pages_quick_links\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_quick_links\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_quick_links\` RENAME TO \`home_pages_quick_links\`;`,
  )
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(
    sql`CREATE INDEX \`home_pages_quick_links_order_idx\` ON \`home_pages_quick_links\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_quick_links_parent_id_idx\` ON \`home_pages_quick_links\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_image_link_grid_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_new_tab\` integer,
  	\`link_url\` text,
  	\`caption\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages_blocks_image_link_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_blocks_image_link_grid_columns\`("_order", "_parent_id", "id", "image_id", "link_type", "link_new_tab", "link_url", "caption") SELECT "_order", "_parent_id", "id", "image_id", "link_type", "link_new_tab", "link_url", "caption" FROM \`home_pages_blocks_image_link_grid_columns\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_image_link_grid_columns\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_image_link_grid_columns\` RENAME TO \`home_pages_blocks_image_link_grid_columns\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_link_grid_columns_order_idx\` ON \`home_pages_blocks_image_link_grid_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_link_grid_columns_parent_id_idx\` ON \`home_pages_blocks_image_link_grid_columns\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_link_grid_columns_image_idx\` ON \`home_pages_blocks_image_link_grid_columns\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_link_preview_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`text\` text,
  	\`button_type\` text DEFAULT 'internal',
  	\`button_new_tab\` integer,
  	\`button_url\` text,
  	\`button_label\` text,
  	\`button_appearance\` text DEFAULT 'default',
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages_blocks_link_preview\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_blocks_link_preview_cards\`("_order", "_parent_id", "id", "image_id", "title", "text", "button_type", "button_new_tab", "button_url", "button_label", "button_appearance") SELECT "_order", "_parent_id", "id", "image_id", "title", "text", "button_type", "button_new_tab", "button_url", "button_label", "button_appearance" FROM \`home_pages_blocks_link_preview_cards\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_link_preview_cards\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_link_preview_cards\` RENAME TO \`home_pages_blocks_link_preview_cards\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_cards_order_idx\` ON \`home_pages_blocks_link_preview_cards\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_cards_parent_id_idx\` ON \`home_pages_blocks_link_preview_cards\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_cards_image_idx\` ON \`home_pages_blocks_link_preview_cards\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_version_quick_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`type\` text DEFAULT 'internal',
  	\`new_tab\` integer,
  	\`url\` text,
  	\`label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_version_quick_links\`("_order", "_parent_id", "id", "type", "new_tab", "url", "label", "_uuid") SELECT "_order", "_parent_id", "id", "type", "new_tab", "url", "label", "_uuid" FROM \`_home_pages_v_version_quick_links\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_version_quick_links\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_version_quick_links\` RENAME TO \`_home_pages_v_version_quick_links\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_quick_links_order_idx\` ON \`_home_pages_v_version_quick_links\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_quick_links_parent_id_idx\` ON \`_home_pages_v_version_quick_links\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_image_link_grid_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_new_tab\` integer,
  	\`link_url\` text,
  	\`caption\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v_blocks_image_link_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_blocks_image_link_grid_columns\`("_order", "_parent_id", "id", "image_id", "link_type", "link_new_tab", "link_url", "caption", "_uuid") SELECT "_order", "_parent_id", "id", "image_id", "link_type", "link_new_tab", "link_url", "caption", "_uuid" FROM \`_home_pages_v_blocks_image_link_grid_columns\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_image_link_grid_columns\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_image_link_grid_columns\` RENAME TO \`_home_pages_v_blocks_image_link_grid_columns\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_link_grid_columns_order_idx\` ON \`_home_pages_v_blocks_image_link_grid_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_link_grid_columns_parent_id_idx\` ON \`_home_pages_v_blocks_image_link_grid_columns\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_link_grid_columns_image_idx\` ON \`_home_pages_v_blocks_image_link_grid_columns\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_link_preview_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`text\` text,
  	\`button_type\` text DEFAULT 'internal',
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
    sql`INSERT INTO \`__new__home_pages_v_blocks_link_preview_cards\`("_order", "_parent_id", "id", "image_id", "title", "text", "button_type", "button_new_tab", "button_url", "button_label", "button_appearance", "_uuid") SELECT "_order", "_parent_id", "id", "image_id", "title", "text", "button_type", "button_new_tab", "button_url", "button_label", "button_appearance", "_uuid" FROM \`_home_pages_v_blocks_link_preview_cards\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_link_preview_cards\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_link_preview_cards\` RENAME TO \`_home_pages_v_blocks_link_preview_cards\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_cards_order_idx\` ON \`_home_pages_v_blocks_link_preview_cards\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_cards_parent_id_idx\` ON \`_home_pages_v_blocks_link_preview_cards\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_cards_image_idx\` ON \`_home_pages_v_blocks_link_preview_cards\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_image_link_grid_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_new_tab\` integer,
  	\`link_url\` text,
  	\`caption\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_image_link_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_image_link_grid_columns\`("_order", "_parent_id", "id", "image_id", "link_type", "link_new_tab", "link_url", "caption") SELECT "_order", "_parent_id", "id", "image_id", "link_type", "link_new_tab", "link_url", "caption" FROM \`pages_blocks_image_link_grid_columns\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_image_link_grid_columns\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_image_link_grid_columns\` RENAME TO \`pages_blocks_image_link_grid_columns\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_link_grid_columns_order_idx\` ON \`pages_blocks_image_link_grid_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_link_grid_columns_parent_id_idx\` ON \`pages_blocks_image_link_grid_columns\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_link_grid_columns_image_idx\` ON \`pages_blocks_image_link_grid_columns\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_link_preview_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`text\` text,
  	\`button_type\` text DEFAULT 'internal',
  	\`button_new_tab\` integer,
  	\`button_url\` text,
  	\`button_label\` text,
  	\`button_appearance\` text DEFAULT 'default',
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_link_preview\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_link_preview_cards\`("_order", "_parent_id", "id", "image_id", "title", "text", "button_type", "button_new_tab", "button_url", "button_label", "button_appearance") SELECT "_order", "_parent_id", "id", "image_id", "title", "text", "button_type", "button_new_tab", "button_url", "button_label", "button_appearance" FROM \`pages_blocks_link_preview_cards\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_link_preview_cards\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_link_preview_cards\` RENAME TO \`pages_blocks_link_preview_cards\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_link_preview_cards_order_idx\` ON \`pages_blocks_link_preview_cards\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_link_preview_cards_parent_id_idx\` ON \`pages_blocks_link_preview_cards\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_link_preview_cards_image_idx\` ON \`pages_blocks_link_preview_cards\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_image_link_grid_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_new_tab\` integer,
  	\`link_url\` text,
  	\`caption\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_image_link_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_image_link_grid_columns\`("_order", "_parent_id", "id", "image_id", "link_type", "link_new_tab", "link_url", "caption", "_uuid") SELECT "_order", "_parent_id", "id", "image_id", "link_type", "link_new_tab", "link_url", "caption", "_uuid" FROM \`_pages_v_blocks_image_link_grid_columns\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_image_link_grid_columns\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_image_link_grid_columns\` RENAME TO \`_pages_v_blocks_image_link_grid_columns\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_link_grid_columns_order_idx\` ON \`_pages_v_blocks_image_link_grid_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_link_grid_columns_parent_id_idx\` ON \`_pages_v_blocks_image_link_grid_columns\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_link_grid_columns_image_idx\` ON \`_pages_v_blocks_image_link_grid_columns\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_link_preview_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`text\` text,
  	\`button_type\` text DEFAULT 'internal',
  	\`button_new_tab\` integer,
  	\`button_url\` text,
  	\`button_label\` text,
  	\`button_appearance\` text DEFAULT 'default',
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_link_preview\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_link_preview_cards\`("_order", "_parent_id", "id", "image_id", "title", "text", "button_type", "button_new_tab", "button_url", "button_label", "button_appearance", "_uuid") SELECT "_order", "_parent_id", "id", "image_id", "title", "text", "button_type", "button_new_tab", "button_url", "button_label", "button_appearance", "_uuid" FROM \`_pages_v_blocks_link_preview_cards\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_link_preview_cards\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_link_preview_cards\` RENAME TO \`_pages_v_blocks_link_preview_cards\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_link_preview_cards_order_idx\` ON \`_pages_v_blocks_link_preview_cards\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_link_preview_cards_parent_id_idx\` ON \`_pages_v_blocks_link_preview_cards\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_link_preview_cards_image_idx\` ON \`_pages_v_blocks_link_preview_cards\` (\`image_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_rels\` ADD \`built_in_pages_id\` integer REFERENCES built_in_pages(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_built_in_pages_id_idx\` ON \`home_pages_rels\` (\`built_in_pages_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_rels\` ADD \`built_in_pages_id\` integer REFERENCES built_in_pages(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_built_in_pages_id_idx\` ON \`_home_pages_v_rels\` (\`built_in_pages_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_rels\` ADD \`built_in_pages_id\` integer REFERENCES built_in_pages(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_rels_built_in_pages_id_idx\` ON \`pages_rels\` (\`built_in_pages_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_rels\` ADD \`built_in_pages_id\` integer REFERENCES built_in_pages(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_built_in_pages_id_idx\` ON \`_pages_v_rels\` (\`built_in_pages_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`navigations_rels\` ADD \`built_in_pages_id\` integer REFERENCES built_in_pages(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`navigations_rels_built_in_pages_id_idx\` ON \`navigations_rels\` (\`built_in_pages_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v_rels\` ADD \`built_in_pages_id\` integer REFERENCES built_in_pages(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_rels_built_in_pages_id_idx\` ON \`_navigations_v_rels\` (\`built_in_pages_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`built_in_pages_id\` integer REFERENCES built_in_pages(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_built_in_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`built_in_pages_id\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`built_in_pages\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_home_pages_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`posts_id\` integer,
  	\`tags_id\` integer,
  	\`sponsors_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sponsors_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_rels\`("id", "order", "parent_id", "path", "pages_id", "posts_id", "tags_id", "sponsors_id") SELECT "id", "order", "parent_id", "path", "pages_id", "posts_id", "tags_id", "sponsors_id" FROM \`home_pages_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_home_pages_rels\` RENAME TO \`home_pages_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
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
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_tags_id_idx\` ON \`home_pages_rels\` (\`tags_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_sponsors_id_idx\` ON \`home_pages_rels\` (\`sponsors_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`posts_id\` integer,
  	\`tags_id\` integer,
  	\`sponsors_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sponsors_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_rels\`("id", "order", "parent_id", "path", "pages_id", "posts_id", "tags_id", "sponsors_id") SELECT "id", "order", "parent_id", "path", "pages_id", "posts_id", "tags_id", "sponsors_id" FROM \`_home_pages_v_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new__home_pages_v_rels\` RENAME TO \`_home_pages_v_rels\`;`)
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
    sql`CREATE INDEX \`_home_pages_v_rels_tags_id_idx\` ON \`_home_pages_v_rels\` (\`tags_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_sponsors_id_idx\` ON \`_home_pages_v_rels\` (\`sponsors_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`tags_id\` integer,
  	\`posts_id\` integer,
  	\`pages_id\` integer,
  	\`sponsors_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sponsors_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_rels\`("id", "order", "parent_id", "path", "tags_id", "posts_id", "pages_id", "sponsors_id") SELECT "id", "order", "parent_id", "path", "tags_id", "posts_id", "pages_id", "sponsors_id" FROM \`pages_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_rels\` RENAME TO \`pages_rels\`;`)
  await db.run(sql`CREATE INDEX \`pages_rels_order_idx\` ON \`pages_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_parent_idx\` ON \`pages_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_path_idx\` ON \`pages_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_tags_id_idx\` ON \`pages_rels\` (\`tags_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_posts_id_idx\` ON \`pages_rels\` (\`posts_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_pages_id_idx\` ON \`pages_rels\` (\`pages_id\`);`)
  await db.run(
    sql`CREATE INDEX \`pages_rels_sponsors_id_idx\` ON \`pages_rels\` (\`sponsors_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`tags_id\` integer,
  	\`posts_id\` integer,
  	\`pages_id\` integer,
  	\`sponsors_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sponsors_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_rels\`("id", "order", "parent_id", "path", "tags_id", "posts_id", "pages_id", "sponsors_id") SELECT "id", "order", "parent_id", "path", "tags_id", "posts_id", "pages_id", "sponsors_id" FROM \`_pages_v_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_rels\` RENAME TO \`_pages_v_rels\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_order_idx\` ON \`_pages_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_parent_idx\` ON \`_pages_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_path_idx\` ON \`_pages_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_tags_id_idx\` ON \`_pages_v_rels\` (\`tags_id\`);`)
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_posts_id_idx\` ON \`_pages_v_rels\` (\`posts_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_pages_id_idx\` ON \`_pages_v_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_sponsors_id_idx\` ON \`_pages_v_rels\` (\`sponsors_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_navigations_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`posts_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`navigations\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_navigations_rels\`("id", "order", "parent_id", "path", "pages_id", "posts_id") SELECT "id", "order", "parent_id", "path", "pages_id", "posts_id" FROM \`navigations_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`navigations_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_navigations_rels\` RENAME TO \`navigations_rels\`;`)
  await db.run(
    sql`CREATE INDEX \`navigations_rels_order_idx\` ON \`navigations_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`navigations_rels_parent_idx\` ON \`navigations_rels\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`navigations_rels_path_idx\` ON \`navigations_rels\` (\`path\`);`)
  await db.run(
    sql`CREATE INDEX \`navigations_rels_pages_id_idx\` ON \`navigations_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`navigations_rels_posts_id_idx\` ON \`navigations_rels\` (\`posts_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__navigations_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`posts_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_navigations_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__navigations_v_rels\`("id", "order", "parent_id", "path", "pages_id", "posts_id") SELECT "id", "order", "parent_id", "path", "pages_id", "posts_id" FROM \`_navigations_v_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`_navigations_v_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new__navigations_v_rels\` RENAME TO \`_navigations_v_rels\`;`)
  await db.run(
    sql`CREATE INDEX \`_navigations_v_rels_order_idx\` ON \`_navigations_v_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_rels_parent_idx\` ON \`_navigations_v_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_rels_path_idx\` ON \`_navigations_v_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_rels_pages_id_idx\` ON \`_navigations_v_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_rels_posts_id_idx\` ON \`_navigations_v_rels\` (\`posts_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`home_pages_id\` integer,
  	\`pages_id\` integer,
  	\`posts_id\` integer,
  	\`media_id\` integer,
  	\`documents_id\` integer,
  	\`sponsors_id\` integer,
  	\`tags_id\` integer,
  	\`biographies_id\` integer,
  	\`teams_id\` integer,
  	\`users_id\` integer,
  	\`roles_id\` integer,
  	\`role_assignments_id\` integer,
  	\`global_roles_id\` integer,
  	\`global_role_assignments_id\` integer,
  	\`navigations_id\` integer,
  	\`tenants_id\` integer,
  	\`settings_id\` integer,
  	\`redirects_id\` integer,
  	\`forms_id\` integer,
  	\`form_submissions_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`home_pages_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`documents_id\`) REFERENCES \`documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sponsors_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`biographies_id\`) REFERENCES \`biographies\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`teams_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`roles_id\`) REFERENCES \`roles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`role_assignments_id\`) REFERENCES \`role_assignments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`global_roles_id\`) REFERENCES \`global_roles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`global_role_assignments_id\`) REFERENCES \`global_role_assignments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`navigations_id\`) REFERENCES \`navigations\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tenants_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`settings_id\`) REFERENCES \`settings\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`redirects_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`forms_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "home_pages_id", "pages_id", "posts_id", "media_id", "documents_id", "sponsors_id", "tags_id", "biographies_id", "teams_id", "users_id", "roles_id", "role_assignments_id", "global_roles_id", "global_role_assignments_id", "navigations_id", "tenants_id", "settings_id", "redirects_id", "forms_id", "form_submissions_id") SELECT "id", "order", "parent_id", "path", "home_pages_id", "pages_id", "posts_id", "media_id", "documents_id", "sponsors_id", "tags_id", "biographies_id", "teams_id", "users_id", "roles_id", "role_assignments_id", "global_roles_id", "global_role_assignments_id", "navigations_id", "tenants_id", "settings_id", "redirects_id", "forms_id", "form_submissions_id" FROM \`payload_locked_documents_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`,
  )
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
    sql`CREATE INDEX \`payload_locked_documents_rels_home_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`home_pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`posts_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_documents_id_idx\` ON \`payload_locked_documents_rels\` (\`documents_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_sponsors_id_idx\` ON \`payload_locked_documents_rels\` (\`sponsors_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_tags_id_idx\` ON \`payload_locked_documents_rels\` (\`tags_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_biographies_id_idx\` ON \`payload_locked_documents_rels\` (\`biographies_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_teams_id_idx\` ON \`payload_locked_documents_rels\` (\`teams_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`,
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
    sql`CREATE INDEX \`payload_locked_documents_rels_tenants_id_idx\` ON \`payload_locked_documents_rels\` (\`tenants_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_settings_id_idx\` ON \`payload_locked_documents_rels\` (\`settings_id\`);`,
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
  await db.run(sql`CREATE TABLE \`__new_home_pages_quick_links\` (
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
    sql`INSERT INTO \`__new_home_pages_quick_links\`("_order", "_parent_id", "id", "type", "new_tab", "url", "label") SELECT "_order", "_parent_id", "id", "type", "new_tab", "url", "label" FROM \`home_pages_quick_links\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_quick_links\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_quick_links\` RENAME TO \`home_pages_quick_links\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_quick_links_order_idx\` ON \`home_pages_quick_links\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_quick_links_parent_id_idx\` ON \`home_pages_quick_links\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_image_link_grid_columns\` (
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
    sql`INSERT INTO \`__new_home_pages_blocks_image_link_grid_columns\`("_order", "_parent_id", "id", "image_id", "link_type", "link_new_tab", "link_url", "caption") SELECT "_order", "_parent_id", "id", "image_id", "link_type", "link_new_tab", "link_url", "caption" FROM \`home_pages_blocks_image_link_grid_columns\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_image_link_grid_columns\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_image_link_grid_columns\` RENAME TO \`home_pages_blocks_image_link_grid_columns\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_link_grid_columns_order_idx\` ON \`home_pages_blocks_image_link_grid_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_link_grid_columns_parent_id_idx\` ON \`home_pages_blocks_image_link_grid_columns\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_image_link_grid_columns_image_idx\` ON \`home_pages_blocks_image_link_grid_columns\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_link_preview_cards\` (
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
    sql`INSERT INTO \`__new_home_pages_blocks_link_preview_cards\`("_order", "_parent_id", "id", "image_id", "title", "text", "button_type", "button_new_tab", "button_url", "button_label", "button_appearance") SELECT "_order", "_parent_id", "id", "image_id", "title", "text", "button_type", "button_new_tab", "button_url", "button_label", "button_appearance" FROM \`home_pages_blocks_link_preview_cards\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_link_preview_cards\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_link_preview_cards\` RENAME TO \`home_pages_blocks_link_preview_cards\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_cards_order_idx\` ON \`home_pages_blocks_link_preview_cards\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_cards_parent_id_idx\` ON \`home_pages_blocks_link_preview_cards\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_link_preview_cards_image_idx\` ON \`home_pages_blocks_link_preview_cards\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_version_quick_links\` (
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
    sql`INSERT INTO \`__new__home_pages_v_version_quick_links\`("_order", "_parent_id", "id", "type", "new_tab", "url", "label", "_uuid") SELECT "_order", "_parent_id", "id", "type", "new_tab", "url", "label", "_uuid" FROM \`_home_pages_v_version_quick_links\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_version_quick_links\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_version_quick_links\` RENAME TO \`_home_pages_v_version_quick_links\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_quick_links_order_idx\` ON \`_home_pages_v_version_quick_links\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_quick_links_parent_id_idx\` ON \`_home_pages_v_version_quick_links\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_image_link_grid_columns\` (
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
    sql`INSERT INTO \`__new__home_pages_v_blocks_image_link_grid_columns\`("_order", "_parent_id", "id", "image_id", "link_type", "link_new_tab", "link_url", "caption", "_uuid") SELECT "_order", "_parent_id", "id", "image_id", "link_type", "link_new_tab", "link_url", "caption", "_uuid" FROM \`_home_pages_v_blocks_image_link_grid_columns\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_image_link_grid_columns\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_image_link_grid_columns\` RENAME TO \`_home_pages_v_blocks_image_link_grid_columns\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_link_grid_columns_order_idx\` ON \`_home_pages_v_blocks_image_link_grid_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_link_grid_columns_parent_id_idx\` ON \`_home_pages_v_blocks_image_link_grid_columns\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_image_link_grid_columns_image_idx\` ON \`_home_pages_v_blocks_image_link_grid_columns\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_link_preview_cards\` (
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
    sql`INSERT INTO \`__new__home_pages_v_blocks_link_preview_cards\`("_order", "_parent_id", "id", "image_id", "title", "text", "button_type", "button_new_tab", "button_url", "button_label", "button_appearance", "_uuid") SELECT "_order", "_parent_id", "id", "image_id", "title", "text", "button_type", "button_new_tab", "button_url", "button_label", "button_appearance", "_uuid" FROM \`_home_pages_v_blocks_link_preview_cards\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_link_preview_cards\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_link_preview_cards\` RENAME TO \`_home_pages_v_blocks_link_preview_cards\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_cards_order_idx\` ON \`_home_pages_v_blocks_link_preview_cards\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_cards_parent_id_idx\` ON \`_home_pages_v_blocks_link_preview_cards\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_link_preview_cards_image_idx\` ON \`_home_pages_v_blocks_link_preview_cards\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_image_link_grid_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`link_type\` text DEFAULT 'reference',
  	\`link_new_tab\` integer,
  	\`link_url\` text,
  	\`caption\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_image_link_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_image_link_grid_columns\`("_order", "_parent_id", "id", "image_id", "link_type", "link_new_tab", "link_url", "caption") SELECT "_order", "_parent_id", "id", "image_id", "link_type", "link_new_tab", "link_url", "caption" FROM \`pages_blocks_image_link_grid_columns\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_image_link_grid_columns\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_image_link_grid_columns\` RENAME TO \`pages_blocks_image_link_grid_columns\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_link_grid_columns_order_idx\` ON \`pages_blocks_image_link_grid_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_link_grid_columns_parent_id_idx\` ON \`pages_blocks_image_link_grid_columns\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_link_grid_columns_image_idx\` ON \`pages_blocks_image_link_grid_columns\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_link_preview_cards\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_link_preview\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_link_preview_cards\`("_order", "_parent_id", "id", "image_id", "title", "text", "button_type", "button_new_tab", "button_url", "button_label", "button_appearance") SELECT "_order", "_parent_id", "id", "image_id", "title", "text", "button_type", "button_new_tab", "button_url", "button_label", "button_appearance" FROM \`pages_blocks_link_preview_cards\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_link_preview_cards\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_link_preview_cards\` RENAME TO \`pages_blocks_link_preview_cards\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_link_preview_cards_order_idx\` ON \`pages_blocks_link_preview_cards\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_link_preview_cards_parent_id_idx\` ON \`pages_blocks_link_preview_cards\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_link_preview_cards_image_idx\` ON \`pages_blocks_link_preview_cards\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_image_link_grid_columns\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_image_link_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_image_link_grid_columns\`("_order", "_parent_id", "id", "image_id", "link_type", "link_new_tab", "link_url", "caption", "_uuid") SELECT "_order", "_parent_id", "id", "image_id", "link_type", "link_new_tab", "link_url", "caption", "_uuid" FROM \`_pages_v_blocks_image_link_grid_columns\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_image_link_grid_columns\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_image_link_grid_columns\` RENAME TO \`_pages_v_blocks_image_link_grid_columns\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_link_grid_columns_order_idx\` ON \`_pages_v_blocks_image_link_grid_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_link_grid_columns_parent_id_idx\` ON \`_pages_v_blocks_image_link_grid_columns\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_link_grid_columns_image_idx\` ON \`_pages_v_blocks_image_link_grid_columns\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_link_preview_cards\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_link_preview\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_link_preview_cards\`("_order", "_parent_id", "id", "image_id", "title", "text", "button_type", "button_new_tab", "button_url", "button_label", "button_appearance", "_uuid") SELECT "_order", "_parent_id", "id", "image_id", "title", "text", "button_type", "button_new_tab", "button_url", "button_label", "button_appearance", "_uuid" FROM \`_pages_v_blocks_link_preview_cards\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_link_preview_cards\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_link_preview_cards\` RENAME TO \`_pages_v_blocks_link_preview_cards\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_link_preview_cards_order_idx\` ON \`_pages_v_blocks_link_preview_cards\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_link_preview_cards_parent_id_idx\` ON \`_pages_v_blocks_link_preview_cards\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_link_preview_cards_image_idx\` ON \`_pages_v_blocks_link_preview_cards\` (\`image_id\`);`,
  )
}
