import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

// A page's old Table columns selection isn't carried over: its table shows every reading until an
// editor hides some per station (see the explanation file).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`station_pages_columns\`;`)
  await db.run(sql`ALTER TABLE \`station_pages\` ADD \`column_order\` text DEFAULT '[]';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`station_pages_columns\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`station_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`station_pages_columns_order_idx\` ON \`station_pages_columns\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`station_pages_columns_parent_idx\` ON \`station_pages_columns\` (\`parent_id\`);`,
  )
  await db.run(sql`ALTER TABLE \`station_pages\` DROP COLUMN \`column_order\`;`)
}
