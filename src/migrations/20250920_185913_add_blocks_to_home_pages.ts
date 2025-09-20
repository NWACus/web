import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`home_pages_blocks_blog_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`post_options\` text DEFAULT 'dynamic',
  	\`dynamic_options_sort_by\` text DEFAULT '-publishedAt',
  	\`dynamic_options_max_posts\` numeric DEFAULT 4,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_blog_list_order_idx\` ON \`home_pages_blocks_blog_list\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_blog_list_parent_id_idx\` ON \`home_pages_blocks_blog_list\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_blog_list_path_idx\` ON \`home_pages_blocks_blog_list\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_document_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`document_id\` integer,
  	\`wrap_in_container\` integer DEFAULT false,
  	\`block_name\` text,
  	FOREIGN KEY (\`document_id\`) REFERENCES \`documents\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_document_block_order_idx\` ON \`home_pages_blocks_document_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_document_block_parent_id_idx\` ON \`home_pages_blocks_document_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_document_block_path_idx\` ON \`home_pages_blocks_document_block\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_document_block_document_idx\` ON \`home_pages_blocks_document_block\` (\`document_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_single_blog_post\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`post_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_single_blog_post_order_idx\` ON \`home_pages_blocks_single_blog_post\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_single_blog_post_parent_id_idx\` ON \`home_pages_blocks_single_blog_post\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_single_blog_post_path_idx\` ON \`home_pages_blocks_single_blog_post\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_single_blog_post_post_idx\` ON \`home_pages_blocks_single_blog_post\` (\`post_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_sponsors_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_sponsors_block_order_idx\` ON \`home_pages_blocks_sponsors_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_sponsors_block_parent_id_idx\` ON \`home_pages_blocks_sponsors_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_sponsors_block_path_idx\` ON \`home_pages_blocks_sponsors_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_generic_embed\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`html\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`align_content\` text DEFAULT 'left',
  	\`embed_height\` numeric,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_generic_embed_order_idx\` ON \`home_pages_blocks_generic_embed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_generic_embed_parent_id_idx\` ON \`home_pages_blocks_generic_embed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_generic_embed_path_idx\` ON \`home_pages_blocks_generic_embed\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_blog_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`post_options\` text DEFAULT 'dynamic',
  	\`dynamic_options_sort_by\` text DEFAULT '-publishedAt',
  	\`dynamic_options_max_posts\` numeric DEFAULT 4,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_blog_list_order_idx\` ON \`_home_pages_v_blocks_blog_list\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_blog_list_parent_id_idx\` ON \`_home_pages_v_blocks_blog_list\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_blog_list_path_idx\` ON \`_home_pages_v_blocks_blog_list\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_document_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`document_id\` integer,
  	\`wrap_in_container\` integer DEFAULT false,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`document_id\`) REFERENCES \`documents\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_document_block_order_idx\` ON \`_home_pages_v_blocks_document_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_document_block_parent_id_idx\` ON \`_home_pages_v_blocks_document_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_document_block_path_idx\` ON \`_home_pages_v_blocks_document_block\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_document_block_document_idx\` ON \`_home_pages_v_blocks_document_block\` (\`document_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_single_blog_post\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`post_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_single_blog_post_order_idx\` ON \`_home_pages_v_blocks_single_blog_post\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_single_blog_post_parent_id_idx\` ON \`_home_pages_v_blocks_single_blog_post\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_single_blog_post_path_idx\` ON \`_home_pages_v_blocks_single_blog_post\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_single_blog_post_post_idx\` ON \`_home_pages_v_blocks_single_blog_post\` (\`post_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_sponsors_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_sponsors_block_order_idx\` ON \`_home_pages_v_blocks_sponsors_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_sponsors_block_parent_id_idx\` ON \`_home_pages_v_blocks_sponsors_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_sponsors_block_path_idx\` ON \`_home_pages_v_blocks_sponsors_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_generic_embed\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_generic_embed_order_idx\` ON \`_home_pages_v_blocks_generic_embed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_generic_embed_parent_id_idx\` ON \`_home_pages_v_blocks_generic_embed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_generic_embed_path_idx\` ON \`_home_pages_v_blocks_generic_embed\` (\`_path\`);`,
  )
  await db.run(sql`ALTER TABLE \`home_pages_rels\` ADD \`tags_id\` integer REFERENCES tags(id);`)
  await db.run(
    sql`ALTER TABLE \`home_pages_rels\` ADD \`sponsors_id\` integer REFERENCES sponsors(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_tags_id_idx\` ON \`home_pages_rels\` (\`tags_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_sponsors_id_idx\` ON \`home_pages_rels\` (\`sponsors_id\`);`,
  )
  await db.run(sql`ALTER TABLE \`_home_pages_v_rels\` ADD \`tags_id\` integer REFERENCES tags(id);`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_rels\` ADD \`sponsors_id\` integer REFERENCES sponsors(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_tags_id_idx\` ON \`_home_pages_v_rels\` (\`tags_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_sponsors_id_idx\` ON \`_home_pages_v_rels\` (\`sponsors_id\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`home_pages_blocks_blog_list\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_document_block\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_single_blog_post\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_sponsors_block\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_generic_embed\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_blog_list\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_document_block\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_single_blog_post\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_sponsors_block\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_generic_embed\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_home_pages_rels\` (
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
  await db.run(
    sql`INSERT INTO \`__new_home_pages_rels\`("id", "order", "parent_id", "path", "pages_id", "posts_id") SELECT "id", "order", "parent_id", "path", "pages_id", "posts_id" FROM \`home_pages_rels\`;`,
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
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_rels\` (
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
    sql`INSERT INTO \`__new__home_pages_v_rels\`("id", "order", "parent_id", "path", "pages_id", "posts_id") SELECT "id", "order", "parent_id", "path", "pages_id", "posts_id" FROM \`_home_pages_v_rels\`;`,
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
}
