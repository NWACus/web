import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`home_pages_rels\` ADD \`station_pages_id\` integer REFERENCES station_pages(id) ON DELETE cascade;`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_station_pages_id_idx\` ON \`home_pages_rels\` (\`station_pages_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_rels\` ADD \`station_pages_id\` integer REFERENCES station_pages(id) ON DELETE cascade;`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_station_pages_id_idx\` ON \`_home_pages_v_rels\` (\`station_pages_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_rels\` ADD \`station_pages_id\` integer REFERENCES station_pages(id) ON DELETE cascade;`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_rels_station_pages_id_idx\` ON \`pages_rels\` (\`station_pages_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_rels\` ADD \`station_pages_id\` integer REFERENCES station_pages(id) ON DELETE cascade;`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_station_pages_id_idx\` ON \`_pages_v_rels\` (\`station_pages_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`navigations_rels\` ADD \`station_pages_id\` integer REFERENCES station_pages(id) ON DELETE cascade;`,
  )
  await db.run(
    sql`CREATE INDEX \`navigations_rels_station_pages_id_idx\` ON \`navigations_rels\` (\`station_pages_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`_navigations_v_rels\` ADD \`station_pages_id\` integer REFERENCES station_pages(id) ON DELETE cascade;`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_rels_station_pages_id_idx\` ON \`_navigations_v_rels\` (\`station_pages_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`redirects_rels\` ADD \`station_pages_id\` integer REFERENCES station_pages(id) ON DELETE cascade;`,
  )
  await db.run(
    sql`CREATE INDEX \`redirects_rels_station_pages_id_idx\` ON \`redirects_rels\` (\`station_pages_id\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_home_pages_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`built_in_pages_id\` integer,
  	\`posts_id\` integer,
  	\`tags_id\` integer,
  	\`event_groups_id\` integer,
  	\`event_tags_id\` integer,
  	\`events_id\` integer,
  	\`sponsors_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`built_in_pages_id\`) REFERENCES \`built_in_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`event_groups_id\`) REFERENCES \`event_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`event_tags_id\`) REFERENCES \`event_tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`events_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sponsors_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_rels\`("id", "order", "parent_id", "path", "pages_id", "built_in_pages_id", "posts_id", "tags_id", "event_groups_id", "event_tags_id", "events_id", "sponsors_id") SELECT "id", "order", "parent_id", "path", "pages_id", "built_in_pages_id", "posts_id", "tags_id", "event_groups_id", "event_tags_id", "events_id", "sponsors_id" FROM \`home_pages_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`home_pages_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_home_pages_rels\` RENAME TO \`home_pages_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`home_pages_rels_order_idx\` ON \`home_pages_rels\` (\`order\`);`)
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_parent_idx\` ON \`home_pages_rels\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`home_pages_rels_path_idx\` ON \`home_pages_rels\` (\`path\`);`)
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_pages_id_idx\` ON \`home_pages_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_built_in_pages_id_idx\` ON \`home_pages_rels\` (\`built_in_pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_posts_id_idx\` ON \`home_pages_rels\` (\`posts_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_tags_id_idx\` ON \`home_pages_rels\` (\`tags_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_event_groups_id_idx\` ON \`home_pages_rels\` (\`event_groups_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_event_tags_id_idx\` ON \`home_pages_rels\` (\`event_tags_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_events_id_idx\` ON \`home_pages_rels\` (\`events_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_sponsors_id_idx\` ON \`home_pages_rels\` (\`sponsors_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__home_pages_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`built_in_pages_id\` integer,
  	\`posts_id\` integer,
  	\`tags_id\` integer,
  	\`event_groups_id\` integer,
  	\`event_tags_id\` integer,
  	\`events_id\` integer,
  	\`sponsors_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`built_in_pages_id\`) REFERENCES \`built_in_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`event_groups_id\`) REFERENCES \`event_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`event_tags_id\`) REFERENCES \`event_tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`events_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sponsors_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_rels\`("id", "order", "parent_id", "path", "pages_id", "built_in_pages_id", "posts_id", "tags_id", "event_groups_id", "event_tags_id", "events_id", "sponsors_id") SELECT "id", "order", "parent_id", "path", "pages_id", "built_in_pages_id", "posts_id", "tags_id", "event_groups_id", "event_tags_id", "events_id", "sponsors_id" FROM \`_home_pages_v_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`_home_pages_v_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new__home_pages_v_rels\` RENAME TO \`_home_pages_v_rels\`;`)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_order_idx\` ON \`_home_pages_v_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_parent_idx\` ON \`_home_pages_v_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_path_idx\` ON \`_home_pages_v_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_pages_id_idx\` ON \`_home_pages_v_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_built_in_pages_id_idx\` ON \`_home_pages_v_rels\` (\`built_in_pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_posts_id_idx\` ON \`_home_pages_v_rels\` (\`posts_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_tags_id_idx\` ON \`_home_pages_v_rels\` (\`tags_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_event_groups_id_idx\` ON \`_home_pages_v_rels\` (\`event_groups_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_event_tags_id_idx\` ON \`_home_pages_v_rels\` (\`event_tags_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_events_id_idx\` ON \`_home_pages_v_rels\` (\`events_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_sponsors_id_idx\` ON \`_home_pages_v_rels\` (\`sponsors_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`tags_id\` integer,
  	\`posts_id\` integer,
  	\`event_groups_id\` integer,
  	\`event_tags_id\` integer,
  	\`events_id\` integer,
  	\`pages_id\` integer,
  	\`built_in_pages_id\` integer,
  	\`sponsors_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`event_groups_id\`) REFERENCES \`event_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`event_tags_id\`) REFERENCES \`event_tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`events_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`built_in_pages_id\`) REFERENCES \`built_in_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sponsors_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_rels\`("id", "order", "parent_id", "path", "tags_id", "posts_id", "event_groups_id", "event_tags_id", "events_id", "pages_id", "built_in_pages_id", "sponsors_id") SELECT "id", "order", "parent_id", "path", "tags_id", "posts_id", "event_groups_id", "event_tags_id", "events_id", "pages_id", "built_in_pages_id", "sponsors_id" FROM \`pages_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_rels\` RENAME TO \`pages_rels\`;`)
  await db.run(sql`CREATE INDEX \`pages_rels_order_idx\` ON \`pages_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_parent_idx\` ON \`pages_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_path_idx\` ON \`pages_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_tags_id_idx\` ON \`pages_rels\` (\`tags_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_posts_id_idx\` ON \`pages_rels\` (\`posts_id\`);`)
  await db.run(
    sql`CREATE INDEX \`pages_rels_event_groups_id_idx\` ON \`pages_rels\` (\`event_groups_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_rels_event_tags_id_idx\` ON \`pages_rels\` (\`event_tags_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`pages_rels_events_id_idx\` ON \`pages_rels\` (\`events_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_pages_id_idx\` ON \`pages_rels\` (\`pages_id\`);`)
  await db.run(
    sql`CREATE INDEX \`pages_rels_built_in_pages_id_idx\` ON \`pages_rels\` (\`built_in_pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_rels_sponsors_id_idx\` ON \`pages_rels\` (\`sponsors_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__pages_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`tags_id\` integer,
  	\`posts_id\` integer,
  	\`event_groups_id\` integer,
  	\`event_tags_id\` integer,
  	\`events_id\` integer,
  	\`pages_id\` integer,
  	\`built_in_pages_id\` integer,
  	\`sponsors_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`event_groups_id\`) REFERENCES \`event_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`event_tags_id\`) REFERENCES \`event_tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`events_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`built_in_pages_id\`) REFERENCES \`built_in_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sponsors_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_rels\`("id", "order", "parent_id", "path", "tags_id", "posts_id", "event_groups_id", "event_tags_id", "events_id", "pages_id", "built_in_pages_id", "sponsors_id") SELECT "id", "order", "parent_id", "path", "tags_id", "posts_id", "event_groups_id", "event_tags_id", "events_id", "pages_id", "built_in_pages_id", "sponsors_id" FROM \`_pages_v_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`_pages_v_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_rels\` RENAME TO \`_pages_v_rels\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_order_idx\` ON \`_pages_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_parent_idx\` ON \`_pages_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_path_idx\` ON \`_pages_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_tags_id_idx\` ON \`_pages_v_rels\` (\`tags_id\`);`)
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_posts_id_idx\` ON \`_pages_v_rels\` (\`posts_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_event_groups_id_idx\` ON \`_pages_v_rels\` (\`event_groups_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_event_tags_id_idx\` ON \`_pages_v_rels\` (\`event_tags_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_events_id_idx\` ON \`_pages_v_rels\` (\`events_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_pages_id_idx\` ON \`_pages_v_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_built_in_pages_id_idx\` ON \`_pages_v_rels\` (\`built_in_pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_sponsors_id_idx\` ON \`_pages_v_rels\` (\`sponsors_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_navigations_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`built_in_pages_id\` integer,
  	\`posts_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`navigations\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`built_in_pages_id\`) REFERENCES \`built_in_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_navigations_rels\`("id", "order", "parent_id", "path", "pages_id", "built_in_pages_id", "posts_id") SELECT "id", "order", "parent_id", "path", "pages_id", "built_in_pages_id", "posts_id" FROM \`navigations_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`navigations_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_navigations_rels\` RENAME TO \`navigations_rels\`;`)
  await db.run(
    sql`CREATE INDEX \`navigations_rels_order_idx\` ON \`navigations_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`navigations_rels_parent_idx\` ON \`navigations_rels\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`navigations_rels_path_idx\` ON \`navigations_rels\` (\`path\`);`)
  await db.run(
    sql`CREATE INDEX \`navigations_rels_pages_id_idx\` ON \`navigations_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`navigations_rels_built_in_pages_id_idx\` ON \`navigations_rels\` (\`built_in_pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`navigations_rels_posts_id_idx\` ON \`navigations_rels\` (\`posts_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new__navigations_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`built_in_pages_id\` integer,
  	\`posts_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_navigations_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`built_in_pages_id\`) REFERENCES \`built_in_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__navigations_v_rels\`("id", "order", "parent_id", "path", "pages_id", "built_in_pages_id", "posts_id") SELECT "id", "order", "parent_id", "path", "pages_id", "built_in_pages_id", "posts_id" FROM \`_navigations_v_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`_navigations_v_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new__navigations_v_rels\` RENAME TO \`_navigations_v_rels\`;`)
  await db.run(
    sql`CREATE INDEX \`_navigations_v_rels_order_idx\` ON \`_navigations_v_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_rels_parent_idx\` ON \`_navigations_v_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_rels_path_idx\` ON \`_navigations_v_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_rels_pages_id_idx\` ON \`_navigations_v_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_rels_built_in_pages_id_idx\` ON \`_navigations_v_rels\` (\`built_in_pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_navigations_v_rels_posts_id_idx\` ON \`_navigations_v_rels\` (\`posts_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_redirects_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`built_in_pages_id\` integer,
  	\`posts_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`built_in_pages_id\`) REFERENCES \`built_in_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_redirects_rels\`("id", "order", "parent_id", "path", "pages_id", "built_in_pages_id", "posts_id") SELECT "id", "order", "parent_id", "path", "pages_id", "built_in_pages_id", "posts_id" FROM \`redirects_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`redirects_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_redirects_rels\` RENAME TO \`redirects_rels\`;`)
  await db.run(sql`CREATE INDEX \`redirects_rels_order_idx\` ON \`redirects_rels\` (\`order\`);`)
  await db.run(
    sql`CREATE INDEX \`redirects_rels_parent_idx\` ON \`redirects_rels\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`redirects_rels_path_idx\` ON \`redirects_rels\` (\`path\`);`)
  await db.run(
    sql`CREATE INDEX \`redirects_rels_pages_id_idx\` ON \`redirects_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`redirects_rels_built_in_pages_id_idx\` ON \`redirects_rels\` (\`built_in_pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`redirects_rels_posts_id_idx\` ON \`redirects_rels\` (\`posts_id\`);`,
  )
}
