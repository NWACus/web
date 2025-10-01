import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_biographies\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`tenant_id\` integer NOT NULL,
  	\`name\` text NOT NULL,
  	\`photo_id\` integer NOT NULL,
  	\`title\` text,
  	\`start_date\` text,
  	\`biography\` text,
  	\`content_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`photo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_biographies\`("id", "tenant_id", "name", "photo_id", "title", "start_date", "biography", "content_hash", "updated_at", "created_at") SELECT "id", "tenant_id", "name", "photo_id", "title", "start_date", "biography", "content_hash", "updated_at", "created_at" FROM \`biographies\`;`,
  )
  await db.run(sql`DROP TABLE \`biographies\`;`)
  await db.run(sql`ALTER TABLE \`__new_biographies\` RENAME TO \`biographies\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`biographies_tenant_idx\` ON \`biographies\` (\`tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`biographies_photo_idx\` ON \`biographies\` (\`photo_id\`);`)
  await db.run(
    sql`CREATE INDEX \`biographies_updated_at_idx\` ON \`biographies\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`biographies_created_at_idx\` ON \`biographies\` (\`created_at\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_biographies\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`tenant_id\` integer NOT NULL,
  	\`user_id\` integer,
  	\`name\` text,
  	\`photo_id\` integer NOT NULL,
  	\`title\` text,
  	\`start_date\` text,
  	\`biography\` text,
  	\`content_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`photo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_biographies\`("id", "tenant_id", "user_id", "name", "photo_id", "title", "start_date", "biography", "content_hash", "updated_at", "created_at") SELECT "id", "tenant_id", "user_id", "name", "photo_id", "title", "start_date", "biography", "content_hash", "updated_at", "created_at" FROM \`biographies\`;`,
  )
  await db.run(sql`DROP TABLE \`biographies\`;`)
  await db.run(sql`ALTER TABLE \`__new_biographies\` RENAME TO \`biographies\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`biographies_tenant_idx\` ON \`biographies\` (\`tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`biographies_user_idx\` ON \`biographies\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`biographies_photo_idx\` ON \`biographies\` (\`photo_id\`);`)
  await db.run(
    sql`CREATE INDEX \`biographies_updated_at_idx\` ON \`biographies\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`biographies_created_at_idx\` ON \`biographies\` (\`created_at\`);`,
  )
}
