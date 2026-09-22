import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`home_pages_blocks_precip_table_columns\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` text NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`home_pages_blocks_precip_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_precip_table_columns_order_idx\` ON \`home_pages_blocks_precip_table_columns\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_precip_table_columns_parent_idx\` ON \`home_pages_blocks_precip_table_columns\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_precip_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`stations\` text DEFAULT '[]',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_precip_table_order_idx\` ON \`home_pages_blocks_precip_table\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_precip_table_parent_id_idx\` ON \`home_pages_blocks_precip_table\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_precip_table_path_idx\` ON \`home_pages_blocks_precip_table\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_precip_table_columns\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_home_pages_v_blocks_precip_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_precip_table_columns_order_idx\` ON \`_home_pages_v_blocks_precip_table_columns\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_precip_table_columns_parent_idx\` ON \`_home_pages_v_blocks_precip_table_columns\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_precip_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`stations\` text DEFAULT '[]',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_precip_table_order_idx\` ON \`_home_pages_v_blocks_precip_table\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_precip_table_parent_id_idx\` ON \`_home_pages_v_blocks_precip_table\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_precip_table_path_idx\` ON \`_home_pages_v_blocks_precip_table\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_precip_table_columns\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` text NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages_blocks_precip_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_precip_table_columns_order_idx\` ON \`pages_blocks_precip_table_columns\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_precip_table_columns_parent_idx\` ON \`pages_blocks_precip_table_columns\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_precip_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`stations\` text DEFAULT '[]',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_precip_table_order_idx\` ON \`pages_blocks_precip_table\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_precip_table_parent_id_idx\` ON \`pages_blocks_precip_table\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_precip_table_path_idx\` ON \`pages_blocks_precip_table\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_precip_table_columns\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v_blocks_precip_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_precip_table_columns_order_idx\` ON \`_pages_v_blocks_precip_table_columns\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_precip_table_columns_parent_idx\` ON \`_pages_v_blocks_precip_table_columns\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_precip_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`stations\` text DEFAULT '[]',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_precip_table_order_idx\` ON \`_pages_v_blocks_precip_table\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_precip_table_parent_id_idx\` ON \`_pages_v_blocks_precip_table\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_precip_table_path_idx\` ON \`_pages_v_blocks_precip_table\` (\`_path\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`home_pages_blocks_precip_table_columns\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_precip_table\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_precip_table_columns\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_precip_table\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_precip_table_columns\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_precip_table\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_precip_table_columns\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_precip_table\`;`)
}
