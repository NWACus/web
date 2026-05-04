import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`home_pages_blocks_in_highlighted_content\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_version_blocks_in_highlighted_content\`;`)
  await db.run(sql`DROP TABLE \`posts_blocks_in_content\`;`)
  await db.run(sql`DROP TABLE \`_posts_v_version_blocks_in_content\`;`)
  await db.run(sql`DROP TABLE \`events_blocks_in_content\`;`)
  await db.run(sql`DROP TABLE \`_events_v_version_blocks_in_content\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`home_pages_blocks_in_highlighted_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`block_type\` text,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_in_highlighted_content_order_idx\` ON \`home_pages_blocks_in_highlighted_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_in_highlighted_content_parent_id_idx\` ON \`home_pages_blocks_in_highlighted_content\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_version_blocks_in_highlighted_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`block_type\` text,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_blocks_in_highlighted_content_order_idx\` ON \`_home_pages_v_version_blocks_in_highlighted_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_blocks_in_highlighted_content_parent_id_idx\` ON \`_home_pages_v_version_blocks_in_highlighted_content\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`posts_blocks_in_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`block_type\` text,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`posts_blocks_in_content_order_idx\` ON \`posts_blocks_in_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_blocks_in_content_parent_id_idx\` ON \`posts_blocks_in_content\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_posts_v_version_blocks_in_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`block_type\` text,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_posts_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_posts_v_version_blocks_in_content_order_idx\` ON \`_posts_v_version_blocks_in_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_v_version_blocks_in_content_parent_id_idx\` ON \`_posts_v_version_blocks_in_content\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`events_blocks_in_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`block_type\` text,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`events_blocks_in_content_order_idx\` ON \`events_blocks_in_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`events_blocks_in_content_parent_id_idx\` ON \`events_blocks_in_content\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_events_v_version_blocks_in_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`block_type\` text,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_events_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_events_v_version_blocks_in_content_order_idx\` ON \`_events_v_version_blocks_in_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_events_v_version_blocks_in_content_parent_id_idx\` ON \`_events_v_version_blocks_in_content\` (\`_parent_id\`);`,
  )
}
