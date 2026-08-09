import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`home_pages_blocks_form_embed\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`html\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`align_content\` text DEFAULT 'left',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_form_embed_order_idx\` ON \`home_pages_blocks_form_embed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_form_embed_parent_id_idx\` ON \`home_pages_blocks_form_embed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_form_embed_path_idx\` ON \`home_pages_blocks_form_embed\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_video_embed\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`html\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`align_content\` text DEFAULT 'left',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_video_embed_order_idx\` ON \`home_pages_blocks_video_embed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_video_embed_parent_id_idx\` ON \`home_pages_blocks_video_embed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_video_embed_path_idx\` ON \`home_pages_blocks_video_embed\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_form_embed\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`html\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`align_content\` text DEFAULT 'left',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_form_embed_order_idx\` ON \`_home_pages_v_blocks_form_embed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_form_embed_parent_id_idx\` ON \`_home_pages_v_blocks_form_embed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_form_embed_path_idx\` ON \`_home_pages_v_blocks_form_embed\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_video_embed\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`html\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`align_content\` text DEFAULT 'left',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_video_embed_order_idx\` ON \`_home_pages_v_blocks_video_embed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_video_embed_parent_id_idx\` ON \`_home_pages_v_blocks_video_embed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_video_embed_path_idx\` ON \`_home_pages_v_blocks_video_embed\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_form_embed\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`html\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`align_content\` text DEFAULT 'left',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_form_embed_order_idx\` ON \`pages_blocks_form_embed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_form_embed_parent_id_idx\` ON \`pages_blocks_form_embed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_form_embed_path_idx\` ON \`pages_blocks_form_embed\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_video_embed\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`html\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`align_content\` text DEFAULT 'left',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_video_embed_order_idx\` ON \`pages_blocks_video_embed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_video_embed_parent_id_idx\` ON \`pages_blocks_video_embed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_video_embed_path_idx\` ON \`pages_blocks_video_embed\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_form_embed\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`html\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`align_content\` text DEFAULT 'left',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_form_embed_order_idx\` ON \`_pages_v_blocks_form_embed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_form_embed_parent_id_idx\` ON \`_pages_v_blocks_form_embed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_form_embed_path_idx\` ON \`_pages_v_blocks_form_embed\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_video_embed\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`html\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`align_content\` text DEFAULT 'left',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_video_embed_order_idx\` ON \`_pages_v_blocks_video_embed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_video_embed_parent_id_idx\` ON \`_pages_v_blocks_video_embed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_video_embed_path_idx\` ON \`_pages_v_blocks_video_embed\` (\`_path\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`home_pages_blocks_form_embed\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_video_embed\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_form_embed\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_video_embed\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_form_embed\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_video_embed\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_form_embed\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_video_embed\`;`)
}
