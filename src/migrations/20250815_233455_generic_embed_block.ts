import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_generic_embed\` (
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
    sql`CREATE INDEX \`pages_blocks_generic_embed_order_idx\` ON \`pages_blocks_generic_embed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_generic_embed_parent_id_idx\` ON \`pages_blocks_generic_embed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_generic_embed_path_idx\` ON \`pages_blocks_generic_embed\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_generic_embed\` (
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
    sql`CREATE INDEX \`_pages_v_blocks_generic_embed_order_idx\` ON \`_pages_v_blocks_generic_embed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_generic_embed_parent_id_idx\` ON \`_pages_v_blocks_generic_embed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_generic_embed_path_idx\` ON \`_pages_v_blocks_generic_embed\` (\`_path\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_generic_embed\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_generic_embed\`;`)
}
