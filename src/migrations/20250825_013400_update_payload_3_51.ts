import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`,
  )
  await db.run(sql`DROP INDEX \`redirects_from_idx\`;`)
  await db.run(sql`CREATE UNIQUE INDEX \`redirects_from_idx\` ON \`redirects\` (\`from\`);`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`deleted_at\` text;`)
  await db.run(sql`CREATE INDEX \`media_deleted_at_idx\` ON \`media\` (\`deleted_at\`);`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`deleted_at\` text;`)
  await db.run(sql`CREATE INDEX \`pages_deleted_at_idx\` ON \`pages\` (\`deleted_at\`);`)
  await db.run(sql`ALTER TABLE \`_pages_v\` ADD \`version_deleted_at\` text;`)
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_version_deleted_at_idx\` ON \`_pages_v\` (\`version_deleted_at\`);`,
  )
  await db.run(sql`ALTER TABLE \`posts\` ADD \`deleted_at\` text;`)
  await db.run(sql`CREATE INDEX \`posts_deleted_at_idx\` ON \`posts\` (\`deleted_at\`);`)
  await db.run(sql`ALTER TABLE \`_posts_v\` ADD \`version_deleted_at\` text;`)
  await db.run(
    sql`CREATE INDEX \`_posts_v_version_version_deleted_at_idx\` ON \`_posts_v\` (\`version_deleted_at\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP INDEX \`media_deleted_at_idx\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`deleted_at\`;`)
  await db.run(sql`DROP INDEX \`pages_deleted_at_idx\`;`)
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`deleted_at\`;`)
  await db.run(sql`DROP INDEX \`_pages_v_version_version_deleted_at_idx\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` DROP COLUMN \`version_deleted_at\`;`)
  await db.run(sql`DROP INDEX \`posts_deleted_at_idx\`;`)
  await db.run(sql`ALTER TABLE \`posts\` DROP COLUMN \`deleted_at\`;`)
  await db.run(sql`DROP INDEX \`_posts_v_version_version_deleted_at_idx\`;`)
  await db.run(sql`ALTER TABLE \`_posts_v\` DROP COLUMN \`version_deleted_at\`;`)
  await db.run(sql`DROP INDEX \`redirects_from_idx\`;`)
  await db.run(sql`CREATE INDEX \`redirects_from_idx\` ON \`redirects\` (\`from\`);`)
}
