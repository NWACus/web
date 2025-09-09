import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`layout\` text DEFAULT '1_1',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "layout", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "layout", "block_name" FROM \`home_pages_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_content\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_content\` RENAME TO \`home_pages_blocks_content\`;`,
  )
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_order_idx\` ON \`home_pages_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_parent_id_idx\` ON \`home_pages_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_path_idx\` ON \`home_pages_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`layout\` text DEFAULT '1_1',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "layout", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "layout", "_uuid", "block_name" FROM \`_home_pages_v_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_content\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_content\` RENAME TO \`_home_pages_v_blocks_content\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_order_idx\` ON \`_home_pages_v_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_parent_id_idx\` ON \`_home_pages_v_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_path_idx\` ON \`_home_pages_v_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`layout\` text DEFAULT '1_1',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "layout", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "layout", "block_name" FROM \`pages_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_content\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_content\` RENAME TO \`pages_blocks_content\`;`)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_order_idx\` ON \`pages_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_parent_id_idx\` ON \`pages_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_path_idx\` ON \`pages_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`layout\` text DEFAULT '1_1',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "layout", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "layout", "_uuid", "block_name" FROM \`_pages_v_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_content\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_content\` RENAME TO \`_pages_v_blocks_content\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_order_idx\` ON \`_pages_v_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_parent_id_idx\` ON \`_pages_v_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_path_idx\` ON \`_pages_v_blocks_content\` (\`_path\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_home_pages_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`layout\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "layout", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "layout", "block_name" FROM \`home_pages_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_blocks_content\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_home_pages_blocks_content\` RENAME TO \`home_pages_blocks_content\`;`,
  )
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_order_idx\` ON \`home_pages_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_parent_id_idx\` ON \`home_pages_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_content_path_idx\` ON \`home_pages_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`layout\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "layout", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "layout", "_uuid", "block_name" FROM \`_home_pages_v_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_content\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__home_pages_v_blocks_content\` RENAME TO \`_home_pages_v_blocks_content\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_order_idx\` ON \`_home_pages_v_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_parent_id_idx\` ON \`_home_pages_v_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_content_path_idx\` ON \`_home_pages_v_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`layout\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "layout", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "layout", "block_name" FROM \`pages_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_content\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_content\` RENAME TO \`pages_blocks_content\`;`)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_order_idx\` ON \`pages_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_parent_id_idx\` ON \`pages_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_path_idx\` ON \`pages_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`layout\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "layout", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "layout", "_uuid", "block_name" FROM \`_pages_v_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_content\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_content\` RENAME TO \`_pages_v_blocks_content\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_order_idx\` ON \`_pages_v_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_parent_id_idx\` ON \`_pages_v_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_content_path_idx\` ON \`_pages_v_blocks_content\` (\`_path\`);`,
  )
}
