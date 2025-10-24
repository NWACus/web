import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_content_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`rich_text\` text DEFAULT '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}',
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages_blocks_content\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_blocks_content_columns\`("_order", "_parent_id", "id", "rich_text") SELECT "_order", "_parent_id", "id", "rich_text" FROM \`home_pages_blocks_content_columns\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_content_columns\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_content_columns\` RENAME TO \`home_pages_blocks_content_columns\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_columns_order_idx\` ON \`home_pages_blocks_content_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_columns_parent_id_idx\` ON \`home_pages_blocks_content_columns\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_content_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`rich_text\` text DEFAULT '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}',
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v_blocks_content\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_blocks_content_columns\`("_order", "_parent_id", "id", "rich_text", "_uuid") SELECT "_order", "_parent_id", "id", "rich_text", "_uuid" FROM \`_home_pages_v_blocks_content_columns\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_content_columns\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_content_columns\` RENAME TO \`_home_pages_v_blocks_content_columns\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_columns_order_idx\` ON \`_home_pages_v_blocks_content_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_columns_parent_id_idx\` ON \`_home_pages_v_blocks_content_columns\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_content_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`rich_text\` text DEFAULT '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}',
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_content\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_content_columns\`("_order", "_parent_id", "id", "rich_text") SELECT "_order", "_parent_id", "id", "rich_text" FROM \`pages_blocks_content_columns\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_content_columns\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_content_columns\` RENAME TO \`pages_blocks_content_columns\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_columns_order_idx\` ON \`pages_blocks_content_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_columns_parent_id_idx\` ON \`pages_blocks_content_columns\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_content_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`rich_text\` text DEFAULT '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}',
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_content\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_content_columns\`("_order", "_parent_id", "id", "rich_text", "_uuid") SELECT "_order", "_parent_id", "id", "rich_text", "_uuid" FROM \`_pages_v_blocks_content_columns\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_content_columns\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_content_columns\` RENAME TO \`_pages_v_blocks_content_columns\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_columns_order_idx\` ON \`_pages_v_blocks_content_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_columns_parent_id_idx\` ON \`_pages_v_blocks_content_columns\` (\`_parent_id\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_content_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages_blocks_content\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_blocks_content_columns\`("_order", "_parent_id", "id", "rich_text") SELECT "_order", "_parent_id", "id", "rich_text" FROM \`home_pages_blocks_content_columns\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_content_columns\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_content_columns\` RENAME TO \`home_pages_blocks_content_columns\`;`,
  )
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_columns_order_idx\` ON \`home_pages_blocks_content_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_columns_parent_id_idx\` ON \`home_pages_blocks_content_columns\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_content_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v_blocks_content\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_blocks_content_columns\`("_order", "_parent_id", "id", "rich_text", "_uuid") SELECT "_order", "_parent_id", "id", "rich_text", "_uuid" FROM \`_home_pages_v_blocks_content_columns\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_content_columns\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_content_columns\` RENAME TO \`_home_pages_v_blocks_content_columns\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_columns_order_idx\` ON \`_home_pages_v_blocks_content_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_columns_parent_id_idx\` ON \`_home_pages_v_blocks_content_columns\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_content_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_content\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_content_columns\`("_order", "_parent_id", "id", "rich_text") SELECT "_order", "_parent_id", "id", "rich_text" FROM \`pages_blocks_content_columns\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_content_columns\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_content_columns\` RENAME TO \`pages_blocks_content_columns\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_columns_order_idx\` ON \`pages_blocks_content_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_columns_parent_id_idx\` ON \`pages_blocks_content_columns\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_content_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`rich_text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_content\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_content_columns\`("_order", "_parent_id", "id", "rich_text", "_uuid") SELECT "_order", "_parent_id", "id", "rich_text", "_uuid" FROM \`_pages_v_blocks_content_columns\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_content_columns\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_content_columns\` RENAME TO \`_pages_v_blocks_content_columns\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_columns_order_idx\` ON \`_pages_v_blocks_content_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_columns_parent_id_idx\` ON \`_pages_v_blocks_content_columns\` (\`_parent_id\`);`,
  )
}
