import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "block_name" FROM \`pages_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_content\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_content\` RENAME TO \`pages_blocks_content\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_order_idx\` ON \`pages_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_parent_id_idx\` ON \`pages_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_path_idx\` ON \`pages_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_image_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`quote\` text,
  	\`author\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_image_quote\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "block_name" FROM \`pages_blocks_image_quote\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_image_quote\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_image_quote\` RENAME TO \`pages_blocks_image_quote\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_quote_order_idx\` ON \`pages_blocks_image_quote\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_quote_parent_id_idx\` ON \`pages_blocks_image_quote\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_quote_path_idx\` ON \`pages_blocks_image_quote\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_quote_image_idx\` ON \`pages_blocks_image_quote\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_image_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`rich_text\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_image_text\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "block_name" FROM \`pages_blocks_image_text\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_image_text\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_image_text\` RENAME TO \`pages_blocks_image_text\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_order_idx\` ON \`pages_blocks_image_text\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_parent_id_idx\` ON \`pages_blocks_image_text\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_path_idx\` ON \`pages_blocks_image_text\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_image_idx\` ON \`pages_blocks_image_text\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_content\`("_order", "_parent_id", "_path", "id", "background_color", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "_uuid", "block_name" FROM \`_pages_v_blocks_content\`;`,
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
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_image_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`quote\` text,
  	\`author\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_image_quote\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "quote", "author", "_uuid", "block_name" FROM \`_pages_v_blocks_image_quote\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_image_quote\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_image_quote\` RENAME TO \`_pages_v_blocks_image_quote\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_quote_order_idx\` ON \`_pages_v_blocks_image_quote\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_quote_parent_id_idx\` ON \`_pages_v_blocks_image_quote\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_quote_path_idx\` ON \`_pages_v_blocks_image_quote\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_quote_image_idx\` ON \`_pages_v_blocks_image_quote\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_image_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'white',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`rich_text\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_image_text\`("_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "background_color", "image_layout", "image_id", "rich_text", "_uuid", "block_name" FROM \`_pages_v_blocks_image_text\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_image_text\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_image_text\` RENAME TO \`_pages_v_blocks_image_text\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_order_idx\` ON \`_pages_v_blocks_image_text\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_parent_id_idx\` ON \`_pages_v_blocks_image_text\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_path_idx\` ON \`_pages_v_blocks_image_text\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_image_idx\` ON \`_pages_v_blocks_image_text\` (\`image_id\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`color\` text DEFAULT '#fffff',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_content\`("_order", "_parent_id", "_path", "id", "color", "block_name") SELECT "_order", "_parent_id", "_path", "id", "color", "block_name" FROM \`pages_blocks_content\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_content\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_content\` RENAME TO \`pages_blocks_content\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_order_idx\` ON \`pages_blocks_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_parent_id_idx\` ON \`pages_blocks_content\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_content_path_idx\` ON \`pages_blocks_content\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_image_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`color\` text DEFAULT '#fffff',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`quote\` text,
  	\`author\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_image_quote\`("_order", "_parent_id", "_path", "id", "color", "image_layout", "image_id", "quote", "author", "block_name") SELECT "_order", "_parent_id", "_path", "id", "color", "image_layout", "image_id", "quote", "author", "block_name" FROM \`pages_blocks_image_quote\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_image_quote\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_image_quote\` RENAME TO \`pages_blocks_image_quote\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_quote_order_idx\` ON \`pages_blocks_image_quote\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_quote_parent_id_idx\` ON \`pages_blocks_image_quote\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_quote_path_idx\` ON \`pages_blocks_image_quote\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_quote_image_idx\` ON \`pages_blocks_image_quote\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_image_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`color\` text DEFAULT '#fffff',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`rich_text\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_image_text\`("_order", "_parent_id", "_path", "id", "color", "image_layout", "image_id", "rich_text", "block_name") SELECT "_order", "_parent_id", "_path", "id", "color", "image_layout", "image_id", "rich_text", "block_name" FROM \`pages_blocks_image_text\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_blocks_image_text\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_image_text\` RENAME TO \`pages_blocks_image_text\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_order_idx\` ON \`pages_blocks_image_text\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_parent_id_idx\` ON \`pages_blocks_image_text\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_path_idx\` ON \`pages_blocks_image_text\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_image_text_image_idx\` ON \`pages_blocks_image_text\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`color\` text DEFAULT '#fffff',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_content\`("_order", "_parent_id", "_path", "id", "color", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "color", "_uuid", "block_name" FROM \`_pages_v_blocks_content\`;`,
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
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_image_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`color\` text DEFAULT '#fffff',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`quote\` text,
  	\`author\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_image_quote\`("_order", "_parent_id", "_path", "id", "color", "image_layout", "image_id", "quote", "author", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "color", "image_layout", "image_id", "quote", "author", "_uuid", "block_name" FROM \`_pages_v_blocks_image_quote\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_image_quote\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_image_quote\` RENAME TO \`_pages_v_blocks_image_quote\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_quote_order_idx\` ON \`_pages_v_blocks_image_quote\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_quote_parent_id_idx\` ON \`_pages_v_blocks_image_quote\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_quote_path_idx\` ON \`_pages_v_blocks_image_quote\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_quote_image_idx\` ON \`_pages_v_blocks_image_quote\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_image_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`color\` text DEFAULT '#fffff',
  	\`image_layout\` text DEFAULT 'left',
  	\`image_id\` integer,
  	\`rich_text\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_image_text\`("_order", "_parent_id", "_path", "id", "color", "image_layout", "image_id", "rich_text", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "color", "image_layout", "image_id", "rich_text", "_uuid", "block_name" FROM \`_pages_v_blocks_image_text\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_blocks_image_text\`;`)
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_image_text\` RENAME TO \`_pages_v_blocks_image_text\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_order_idx\` ON \`_pages_v_blocks_image_text\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_parent_id_idx\` ON \`_pages_v_blocks_image_text\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_path_idx\` ON \`_pages_v_blocks_image_text\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_image_text_image_idx\` ON \`_pages_v_blocks_image_text\` (\`image_id\`);`,
  )
}
