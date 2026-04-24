import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`sponsors_document_references\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`instances\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`sponsors_document_references_order_idx\` ON \`sponsors_document_references\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`sponsors_document_references_parent_id_idx\` ON \`sponsors_document_references\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`biographies_document_references\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`instances\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`biographies\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`biographies_document_references_order_idx\` ON \`biographies_document_references\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`biographies_document_references_parent_id_idx\` ON \`biographies_document_references\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`teams_document_references\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`instances\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`teams_document_references_order_idx\` ON \`teams_document_references\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`teams_document_references_parent_id_idx\` ON \`teams_document_references\` (\`_parent_id\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`sponsors_document_references\`;`)
  await db.run(sql`DROP TABLE \`biographies_document_references\`;`)
  await db.run(sql`DROP TABLE \`teams_document_references\`;`)
}
