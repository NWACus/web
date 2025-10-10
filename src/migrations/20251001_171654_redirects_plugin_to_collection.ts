import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_redirects\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`from\` text NOT NULL,
  	\`to_type\` text DEFAULT 'internal',
  	\`to_new_tab\` integer,
  	\`to_url\` text,
  	\`tenant_id\` integer NOT NULL,
  	\`content_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_redirects\`("id", "from", "to_type", "to_url", "tenant_id", "updated_at", "created_at") SELECT "id", "from", "to_type", "to_url", "tenant_id", "updated_at", "created_at" FROM \`redirects\`;`,
  )
  await db.run(sql`DROP TABLE \`redirects\`;`)
  await db.run(sql`ALTER TABLE \`__new_redirects\` RENAME TO \`redirects\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`redirects_from_idx\` ON \`redirects\` (\`from\`);`)
  await db.run(sql`CREATE INDEX \`redirects_tenant_idx\` ON \`redirects\` (\`tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`redirects_updated_at_idx\` ON \`redirects\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`redirects_created_at_idx\` ON \`redirects\` (\`created_at\`);`)
  await db.run(
    sql`ALTER TABLE \`redirects_rels\` ADD \`built_in_pages_id\` integer REFERENCES built_in_pages(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`redirects_rels_built_in_pages_id_idx\` ON \`redirects_rels\` (\`built_in_pages_id\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_redirects_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`posts_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_redirects_rels\`("id", "order", "parent_id", "path", "pages_id", "posts_id") SELECT "id", "order", "parent_id", "path", "pages_id", "posts_id" FROM \`redirects_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`redirects_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_redirects_rels\` RENAME TO \`redirects_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`redirects_rels_order_idx\` ON \`redirects_rels\` (\`order\`);`)
  await db.run(
    sql`CREATE INDEX \`redirects_rels_parent_idx\` ON \`redirects_rels\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`redirects_rels_path_idx\` ON \`redirects_rels\` (\`path\`);`)
  await db.run(
    sql`CREATE INDEX \`redirects_rels_pages_id_idx\` ON \`redirects_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`redirects_rels_posts_id_idx\` ON \`redirects_rels\` (\`posts_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_redirects\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`from\` text NOT NULL,
  	\`to_type\` text DEFAULT 'reference',
  	\`to_url\` text,
  	\`tenant_id\` integer NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_redirects\`("id", "from", "to_type", "to_url", "tenant_id", "updated_at", "created_at") SELECT "id", "from", "to_type", "to_url", "tenant_id", "updated_at", "created_at" FROM \`redirects\`;`,
  )
  await db.run(sql`DROP TABLE \`redirects\`;`)
  await db.run(sql`ALTER TABLE \`__new_redirects\` RENAME TO \`redirects\`;`)
  await db.run(sql`CREATE UNIQUE INDEX \`redirects_from_idx\` ON \`redirects\` (\`from\`);`)
  await db.run(sql`CREATE INDEX \`redirects_tenant_idx\` ON \`redirects\` (\`tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`redirects_updated_at_idx\` ON \`redirects\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`redirects_created_at_idx\` ON \`redirects\` (\`created_at\`);`)
}
