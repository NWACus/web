import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`filterByEventTypes\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` text NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages_blocks_event_list\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`filterByEventTypes_order_idx\` ON \`filterByEventTypes\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`filterByEventTypes_parent_idx\` ON \`filterByEventTypes\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_event_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`event_options\` text DEFAULT 'dynamic',
  	\`dynamic_options_sort_by\` text DEFAULT 'startDate',
  	\`dynamic_options_show_upcoming_only\` integer DEFAULT true,
  	\`dynamic_options_max_events\` numeric DEFAULT 4,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_event_list_order_idx\` ON \`home_pages_blocks_event_list\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_event_list_parent_id_idx\` ON \`home_pages_blocks_event_list\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_event_list_path_idx\` ON \`home_pages_blocks_event_list\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`home_pages_blocks_single_event\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`event_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_single_event_order_idx\` ON \`home_pages_blocks_single_event\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_single_event_parent_id_idx\` ON \`home_pages_blocks_single_event\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_single_event_path_idx\` ON \`home_pages_blocks_single_event\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_single_event_event_idx\` ON \`home_pages_blocks_single_event\` (\`event_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_filterByEventTypes_v\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v_blocks_event_list\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_filterByEventTypes_v_order_idx\` ON \`_filterByEventTypes_v\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_filterByEventTypes_v_parent_idx\` ON \`_filterByEventTypes_v\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_event_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`event_options\` text DEFAULT 'dynamic',
  	\`dynamic_options_sort_by\` text DEFAULT 'startDate',
  	\`dynamic_options_show_upcoming_only\` integer DEFAULT true,
  	\`dynamic_options_max_events\` numeric DEFAULT 4,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_event_list_order_idx\` ON \`_home_pages_v_blocks_event_list\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_event_list_parent_id_idx\` ON \`_home_pages_v_blocks_event_list\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_event_list_path_idx\` ON \`_home_pages_v_blocks_event_list\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_single_event\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`event_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_single_event_order_idx\` ON \`_home_pages_v_blocks_single_event\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_single_event_parent_id_idx\` ON \`_home_pages_v_blocks_single_event\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_single_event_path_idx\` ON \`_home_pages_v_blocks_single_event\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_single_event_event_idx\` ON \`_home_pages_v_blocks_single_event\` (\`event_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_event_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`event_options\` text DEFAULT 'dynamic',
  	\`dynamic_options_sort_by\` text DEFAULT 'startDate',
  	\`dynamic_options_show_upcoming_only\` integer DEFAULT true,
  	\`dynamic_options_max_events\` numeric DEFAULT 4,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_event_list_order_idx\` ON \`pages_blocks_event_list\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_event_list_parent_id_idx\` ON \`pages_blocks_event_list\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_event_list_path_idx\` ON \`pages_blocks_event_list\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_single_event\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`event_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_single_event_order_idx\` ON \`pages_blocks_single_event\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_single_event_parent_id_idx\` ON \`pages_blocks_single_event\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_single_event_path_idx\` ON \`pages_blocks_single_event\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_single_event_event_idx\` ON \`pages_blocks_single_event\` (\`event_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_event_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`background_color\` text DEFAULT 'transparent',
  	\`event_options\` text DEFAULT 'dynamic',
  	\`dynamic_options_sort_by\` text DEFAULT 'startDate',
  	\`dynamic_options_show_upcoming_only\` integer DEFAULT true,
  	\`dynamic_options_max_events\` numeric DEFAULT 4,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_event_list_order_idx\` ON \`_pages_v_blocks_event_list\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_event_list_parent_id_idx\` ON \`_pages_v_blocks_event_list\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_event_list_path_idx\` ON \`_pages_v_blocks_event_list\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_single_event\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`event_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_single_event_order_idx\` ON \`_pages_v_blocks_single_event\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_single_event_parent_id_idx\` ON \`_pages_v_blocks_single_event\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_single_event_path_idx\` ON \`_pages_v_blocks_single_event\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_single_event_event_idx\` ON \`_pages_v_blocks_single_event\` (\`event_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`events_blocks_in_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`block_type\` text,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`events_blocks_in_content_order_idx\` ON \`events_blocks_in_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`events_blocks_in_content_parent_id_idx\` ON \`events_blocks_in_content\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`events\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`subtitle\` text,
  	\`description\` text,
  	\`start_date\` text NOT NULL,
  	\`end_date\` text,
  	\`timezone\` text,
  	\`location_is_virtual\` integer DEFAULT false,
  	\`location_place_name\` text,
  	\`location_address\` text,
  	\`location_city\` text,
  	\`location_state\` text,
  	\`location_zip\` text,
  	\`location_country\` text DEFAULT 'US',
  	\`location_coordinates\` text,
  	\`location_virtual_url\` text,
  	\`location_extra_info\` text,
  	\`featured_image_id\` integer,
  	\`thumbnail_image_id\` integer,
  	\`registration_url\` text,
  	\`external_event_url\` text,
  	\`registration_deadline\` text,
  	\`capacity\` numeric,
  	\`cost\` numeric,
  	\`skill_rating\` text,
  	\`content\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`type\` text NOT NULL,
  	\`sub_type\` text,
  	\`mode_of_travel\` text,
  	\`tenant_id\` integer,
  	\`content_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`thumbnail_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`CREATE INDEX \`events_featured_image_idx\` ON \`events\` (\`featured_image_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`events_thumbnail_image_idx\` ON \`events\` (\`thumbnail_image_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`events_slug_idx\` ON \`events\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`events_tenant_idx\` ON \`events\` (\`tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`events_updated_at_idx\` ON \`events\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`events_created_at_idx\` ON \`events\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`events_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`event_groups_id\` integer,
  	\`event_tags_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`event_groups_id\`) REFERENCES \`event_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`event_tags_id\`) REFERENCES \`event_tags\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`events_rels_order_idx\` ON \`events_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`events_rels_parent_idx\` ON \`events_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`events_rels_path_idx\` ON \`events_rels\` (\`path\`);`)
  await db.run(
    sql`CREATE INDEX \`events_rels_event_groups_id_idx\` ON \`events_rels\` (\`event_groups_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`events_rels_event_tags_id_idx\` ON \`events_rels\` (\`event_tags_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`event_groups\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`tenant_id\` integer NOT NULL,
  	\`title\` text NOT NULL,
  	\`description\` text,
  	\`slug\` text NOT NULL,
  	\`content_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`event_groups_tenant_idx\` ON \`event_groups\` (\`tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`event_groups_slug_idx\` ON \`event_groups\` (\`slug\`);`)
  await db.run(
    sql`CREATE INDEX \`event_groups_updated_at_idx\` ON \`event_groups\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`event_groups_created_at_idx\` ON \`event_groups\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`event_tags\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`tenant_id\` integer NOT NULL,
  	\`title\` text NOT NULL,
  	\`description\` text,
  	\`slug\` text NOT NULL,
  	\`content_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`event_tags_tenant_idx\` ON \`event_tags\` (\`tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`event_tags_slug_idx\` ON \`event_tags\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`event_tags_updated_at_idx\` ON \`event_tags\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`event_tags_created_at_idx\` ON \`event_tags\` (\`created_at\`);`)
  await db.run(
    sql`ALTER TABLE \`home_pages_rels\` ADD \`events_id\` integer REFERENCES events(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_rels_events_id_idx\` ON \`home_pages_rels\` (\`events_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_rels\` ADD \`events_id\` integer REFERENCES events(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_rels_events_id_idx\` ON \`_home_pages_v_rels\` (\`events_id\`);`,
  )
  await db.run(sql`ALTER TABLE \`pages_rels\` ADD \`events_id\` integer REFERENCES events(id);`)
  await db.run(sql`CREATE INDEX \`pages_rels_events_id_idx\` ON \`pages_rels\` (\`events_id\`);`)
  await db.run(sql`ALTER TABLE \`_pages_v_rels\` ADD \`events_id\` integer REFERENCES events(id);`)
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_events_id_idx\` ON \`_pages_v_rels\` (\`events_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`events_id\` integer REFERENCES events(id);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`event_groups_id\` integer REFERENCES event_groups(id);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`event_tags_id\` integer REFERENCES event_tags(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_events_id_idx\` ON \`payload_locked_documents_rels\` (\`events_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_event_groups_id_idx\` ON \`payload_locked_documents_rels\` (\`event_groups_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_event_tags_id_idx\` ON \`payload_locked_documents_rels\` (\`event_tags_id\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`filterByEventTypes\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_event_list\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_single_event\`;`)
  await db.run(sql`DROP TABLE \`_filterByEventTypes_v\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_event_list\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_single_event\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_event_list\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_single_event\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_event_list\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_single_event\`;`)
  await db.run(sql`DROP TABLE \`events_blocks_in_content\`;`)
  await db.run(sql`DROP TABLE \`events\`;`)
  await db.run(sql`DROP TABLE \`events_rels\`;`)
  await db.run(sql`DROP TABLE \`event_groups\`;`)
  await db.run(sql`DROP TABLE \`event_tags\`;`)
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
  	\`sponsors_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`built_in_pages_id\`) REFERENCES \`built_in_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sponsors_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_home_pages_rels\`("id", "order", "parent_id", "path", "pages_id", "built_in_pages_id", "posts_id", "tags_id", "sponsors_id") SELECT "id", "order", "parent_id", "path", "pages_id", "built_in_pages_id", "posts_id", "tags_id", "sponsors_id" FROM \`home_pages_rels\`;`,
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
  	\`sponsors_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`built_in_pages_id\`) REFERENCES \`built_in_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sponsors_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__home_pages_v_rels\`("id", "order", "parent_id", "path", "pages_id", "built_in_pages_id", "posts_id", "tags_id", "sponsors_id") SELECT "id", "order", "parent_id", "path", "pages_id", "built_in_pages_id", "posts_id", "tags_id", "sponsors_id" FROM \`_home_pages_v_rels\`;`,
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
    sql`CREATE INDEX \`_home_pages_v_rels_sponsors_id_idx\` ON \`_home_pages_v_rels\` (\`sponsors_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_pages_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`tags_id\` integer,
  	\`posts_id\` integer,
  	\`pages_id\` integer,
  	\`built_in_pages_id\` integer,
  	\`sponsors_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`built_in_pages_id\`) REFERENCES \`built_in_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sponsors_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_pages_rels\`("id", "order", "parent_id", "path", "tags_id", "posts_id", "pages_id", "built_in_pages_id", "sponsors_id") SELECT "id", "order", "parent_id", "path", "tags_id", "posts_id", "pages_id", "built_in_pages_id", "sponsors_id" FROM \`pages_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`pages_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_rels\` RENAME TO \`pages_rels\`;`)
  await db.run(sql`CREATE INDEX \`pages_rels_order_idx\` ON \`pages_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_parent_idx\` ON \`pages_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_path_idx\` ON \`pages_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_tags_id_idx\` ON \`pages_rels\` (\`tags_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_posts_id_idx\` ON \`pages_rels\` (\`posts_id\`);`)
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
  	\`pages_id\` integer,
  	\`built_in_pages_id\` integer,
  	\`sponsors_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`built_in_pages_id\`) REFERENCES \`built_in_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sponsors_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new__pages_v_rels\`("id", "order", "parent_id", "path", "tags_id", "posts_id", "pages_id", "built_in_pages_id", "sponsors_id") SELECT "id", "order", "parent_id", "path", "tags_id", "posts_id", "pages_id", "built_in_pages_id", "sponsors_id" FROM \`_pages_v_rels\`;`,
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
    sql`CREATE INDEX \`_pages_v_rels_pages_id_idx\` ON \`_pages_v_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_built_in_pages_id_idx\` ON \`_pages_v_rels\` (\`built_in_pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_sponsors_id_idx\` ON \`_pages_v_rels\` (\`sponsors_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`home_pages_id\` integer,
  	\`built_in_pages_id\` integer,
  	\`pages_id\` integer,
  	\`posts_id\` integer,
  	\`media_id\` integer,
  	\`documents_id\` integer,
  	\`sponsors_id\` integer,
  	\`tags_id\` integer,
  	\`biographies_id\` integer,
  	\`teams_id\` integer,
  	\`users_id\` integer,
  	\`roles_id\` integer,
  	\`role_assignments_id\` integer,
  	\`global_roles_id\` integer,
  	\`global_role_assignments_id\` integer,
  	\`tenants_id\` integer,
  	\`navigations_id\` integer,
  	\`settings_id\` integer,
  	\`redirects_id\` integer,
  	\`forms_id\` integer,
  	\`form_submissions_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`home_pages_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`built_in_pages_id\`) REFERENCES \`built_in_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`documents_id\`) REFERENCES \`documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sponsors_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`biographies_id\`) REFERENCES \`biographies\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`teams_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`roles_id\`) REFERENCES \`roles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`role_assignments_id\`) REFERENCES \`role_assignments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`global_roles_id\`) REFERENCES \`global_roles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`global_role_assignments_id\`) REFERENCES \`global_role_assignments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tenants_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`navigations_id\`) REFERENCES \`navigations\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`settings_id\`) REFERENCES \`settings\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`redirects_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`forms_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "home_pages_id", "built_in_pages_id", "pages_id", "posts_id", "media_id", "documents_id", "sponsors_id", "tags_id", "biographies_id", "teams_id", "users_id", "roles_id", "role_assignments_id", "global_roles_id", "global_role_assignments_id", "tenants_id", "navigations_id", "settings_id", "redirects_id", "forms_id", "form_submissions_id") SELECT "id", "order", "parent_id", "path", "home_pages_id", "built_in_pages_id", "pages_id", "posts_id", "media_id", "documents_id", "sponsors_id", "tags_id", "biographies_id", "teams_id", "users_id", "roles_id", "role_assignments_id", "global_roles_id", "global_role_assignments_id", "tenants_id", "navigations_id", "settings_id", "redirects_id", "forms_id", "form_submissions_id" FROM \`payload_locked_documents_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_home_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`home_pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_built_in_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`built_in_pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`posts_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_documents_id_idx\` ON \`payload_locked_documents_rels\` (\`documents_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_sponsors_id_idx\` ON \`payload_locked_documents_rels\` (\`sponsors_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_tags_id_idx\` ON \`payload_locked_documents_rels\` (\`tags_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_biographies_id_idx\` ON \`payload_locked_documents_rels\` (\`biographies_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_teams_id_idx\` ON \`payload_locked_documents_rels\` (\`teams_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_roles_id_idx\` ON \`payload_locked_documents_rels\` (\`roles_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_role_assignments_id_idx\` ON \`payload_locked_documents_rels\` (\`role_assignments_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_global_roles_id_idx\` ON \`payload_locked_documents_rels\` (\`global_roles_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_global_role_assignments_id_idx\` ON \`payload_locked_documents_rels\` (\`global_role_assignments_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_tenants_id_idx\` ON \`payload_locked_documents_rels\` (\`tenants_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_navigations_id_idx\` ON \`payload_locked_documents_rels\` (\`navigations_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_settings_id_idx\` ON \`payload_locked_documents_rels\` (\`settings_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_redirects_id_idx\` ON \`payload_locked_documents_rels\` (\`redirects_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_forms_id_idx\` ON \`payload_locked_documents_rels\` (\`forms_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_form_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`form_submissions_id\`);`,
  )
}
