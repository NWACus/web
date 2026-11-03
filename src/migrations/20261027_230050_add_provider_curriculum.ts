import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`providers_curriculum\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`providers\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`providers_curriculum_order_idx\` ON \`providers_curriculum\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`providers_curriculum_parent_idx\` ON \`providers_curriculum\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_providers_v_version_curriculum\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_providers_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_providers_v_version_curriculum_order_idx\` ON \`_providers_v_version_curriculum\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_providers_v_version_curriculum_parent_idx\` ON \`_providers_v_version_curriculum\` (\`parent_id\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`providers_curriculum\`;`)
  await db.run(sql`DROP TABLE \`_providers_v_version_curriculum\`;`)
}
