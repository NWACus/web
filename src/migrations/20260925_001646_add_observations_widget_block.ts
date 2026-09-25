import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`home_pages_blocks_observations_widget\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_observations_widget_order_idx\` ON \`home_pages_blocks_observations_widget\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_observations_widget_parent_id_idx\` ON \`home_pages_blocks_observations_widget\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_observations_widget_path_idx\` ON \`home_pages_blocks_observations_widget\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_observations_widget\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_observations_widget_order_idx\` ON \`_home_pages_v_blocks_observations_widget\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_observations_widget_parent_id_idx\` ON \`_home_pages_v_blocks_observations_widget\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_observations_widget_path_idx\` ON \`_home_pages_v_blocks_observations_widget\` (\`_path\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`home_pages_blocks_observations_widget\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_observations_widget\`;`)
}
