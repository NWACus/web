import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`settings_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`forms_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`settings\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`forms_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`settings_rels_order_idx\` ON \`settings_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`settings_rels_parent_idx\` ON \`settings_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`settings_rels_path_idx\` ON \`settings_rels\` (\`path\`);`)
  await db.run(
    sql`CREATE INDEX \`settings_rels_forms_id_idx\` ON \`settings_rels\` (\`forms_id\`);`,
  )
  await db.run(sql`ALTER TABLE \`settings\` ADD \`footer_form_title\` text;`)
  await db.run(sql`ALTER TABLE \`settings\` ADD \`footer_form_subtitle\` text;`)
  await db.run(sql`ALTER TABLE \`settings\` ADD \`footer_form_type\` text DEFAULT 'none' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`settings\` ADD \`footer_form_html\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`settings_rels\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`footer_form_title\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`footer_form_subtitle\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`footer_form_type\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`footer_form_html\`;`)
}
