import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_single_blog_post\` (
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
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_single_blog_post\` (
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
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_single_blog_post\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_single_blog_post\`;`)
}
