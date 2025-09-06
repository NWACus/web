import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_content_with_callout\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_content_with_callout\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_content_with_callout\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_content_with_callout\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_content\` ADD \`layout\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_content\` ADD \`layout\` text;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_content\` ADD \`layout\` text;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_content\` ADD \`layout\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_content_with_callout\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	\`callout\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_with_callout_order_idx\` ON \`pages_blocks_content_with_callout\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_with_callout_parent_id_idx\` ON \`pages_blocks_content_with_callout\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_with_callout_path_idx\` ON \`pages_blocks_content_with_callout\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_content_with_callout\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	\`callout\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_with_callout_order_idx\` ON \`_pages_v_blocks_content_with_callout\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_with_callout_parent_id_idx\` ON \`_pages_v_blocks_content_with_callout\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_with_callout_path_idx\` ON \`_pages_v_blocks_content_with_callout\` (\`_path\`);`,
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
  await db.run(sql`ALTER TABLE \`home_pages_blocks_content\` DROP COLUMN \`layout\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_content\` DROP COLUMN \`layout\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_content\` DROP COLUMN \`layout\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_content\` DROP COLUMN \`layout\`;`)
}
