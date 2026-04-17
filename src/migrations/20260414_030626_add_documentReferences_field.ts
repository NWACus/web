import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`home_pages_document_references\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`instances\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_document_references_order_idx\` ON \`home_pages_document_references\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_document_references_parent_id_idx\` ON \`home_pages_document_references\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_document_references_collection_doc_id_idx\` ON \`home_pages_document_references\` (\`collection\`, \`doc_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_version_document_references\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`instances\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_document_references_order_idx\` ON \`_home_pages_v_version_document_references\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_document_references_parent_id_idx\` ON \`_home_pages_v_version_document_references\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_version_document_references_collection_doc_id_idx\` ON \`_home_pages_v_version_document_references\` (\`collection\`, \`doc_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_document_references\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`instances\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_document_references_order_idx\` ON \`pages_document_references\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_document_references_parent_id_idx\` ON \`pages_document_references\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_document_references_collection_doc_id_idx\` ON \`pages_document_references\` (\`collection\`, \`doc_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_version_document_references\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`instances\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_document_references_order_idx\` ON \`_pages_v_version_document_references\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_document_references_parent_id_idx\` ON \`_pages_v_version_document_references\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_document_references_collection_doc_id_idx\` ON \`_pages_v_version_document_references\` (\`collection\`, \`doc_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`posts_document_references\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`instances\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`posts_document_references_order_idx\` ON \`posts_document_references\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_document_references_parent_id_idx\` ON \`posts_document_references\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_document_references_collection_doc_id_idx\` ON \`posts_document_references\` (\`collection\`, \`doc_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_posts_v_version_document_references\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`instances\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_posts_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_posts_v_version_document_references_order_idx\` ON \`_posts_v_version_document_references\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_v_version_document_references_parent_id_idx\` ON \`_posts_v_version_document_references\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_v_version_document_references_collection_doc_id_idx\` ON \`_posts_v_version_document_references\` (\`collection\`, \`doc_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`events_document_references\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`instances\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`events_document_references_order_idx\` ON \`events_document_references\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`events_document_references_parent_id_idx\` ON \`events_document_references\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`events_document_references_collection_doc_id_idx\` ON \`events_document_references\` (\`collection\`, \`doc_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_events_v_version_document_references\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`instances\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_events_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_events_v_version_document_references_order_idx\` ON \`_events_v_version_document_references\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_events_v_version_document_references_parent_id_idx\` ON \`_events_v_version_document_references\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_events_v_version_document_references_collection_doc_id_idx\` ON \`_events_v_version_document_references\` (\`collection\`, \`doc_id\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`home_pages_document_references\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_version_document_references\`;`)
  await db.run(sql`DROP TABLE \`pages_document_references\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_version_document_references\`;`)
  await db.run(sql`DROP TABLE \`posts_document_references\`;`)
  await db.run(sql`DROP TABLE \`_posts_v_version_document_references\`;`)
  await db.run(sql`DROP TABLE \`events_document_references\`;`)
  await db.run(sql`DROP TABLE \`_events_v_version_document_references\`;`)
}
