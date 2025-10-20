import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
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
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`home_pages_blocks_in_highlighted_content\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_version_blocks_in_highlighted_content\`;`)
}
