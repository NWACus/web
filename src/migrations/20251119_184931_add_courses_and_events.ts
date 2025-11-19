import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`filterByEventTypes\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` text NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages_blocks_event_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
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
  	\`background_color\` text DEFAULT 'transparent',
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`event_options\` text DEFAULT 'dynamic',
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
  await db.run(sql`CREATE TABLE \`home_pages_blocks_event_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`event_options\` text DEFAULT 'dynamic',
  	\`dynamic_options_max_events\` numeric DEFAULT 4,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_event_table_order_idx\` ON \`home_pages_blocks_event_table\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_event_table_parent_id_idx\` ON \`home_pages_blocks_event_table\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`home_pages_blocks_event_table_path_idx\` ON \`home_pages_blocks_event_table\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_filterByEventTypes_v\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v_blocks_event_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
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
  	\`background_color\` text DEFAULT 'transparent',
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`event_options\` text DEFAULT 'dynamic',
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
  await db.run(sql`CREATE TABLE \`_home_pages_v_blocks_event_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`event_options\` text DEFAULT 'dynamic',
  	\`dynamic_options_max_events\` numeric DEFAULT 4,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_event_table_order_idx\` ON \`_home_pages_v_blocks_event_table\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_event_table_parent_id_idx\` ON \`_home_pages_v_blocks_event_table\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_home_pages_v_blocks_event_table_path_idx\` ON \`_home_pages_v_blocks_event_table\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_event_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`background_color\` text DEFAULT 'transparent',
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`event_options\` text DEFAULT 'dynamic',
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
  await db.run(sql`CREATE TABLE \`pages_blocks_event_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`event_options\` text DEFAULT 'dynamic',
  	\`dynamic_options_max_events\` numeric DEFAULT 4,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_event_table_order_idx\` ON \`pages_blocks_event_table\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_event_table_parent_id_idx\` ON \`pages_blocks_event_table\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_event_table_path_idx\` ON \`pages_blocks_event_table\` (\`_path\`);`,
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
  	\`background_color\` text DEFAULT 'transparent',
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`event_options\` text DEFAULT 'dynamic',
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
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_event_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`below_heading_content\` text,
  	\`event_options\` text DEFAULT 'dynamic',
  	\`dynamic_options_max_events\` numeric DEFAULT 4,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_event_table_order_idx\` ON \`_pages_v_blocks_event_table\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_event_table_parent_id_idx\` ON \`_pages_v_blocks_event_table\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_event_table_path_idx\` ON \`_pages_v_blocks_event_table\` (\`_path\`);`,
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
  await db.run(sql`CREATE TABLE \`events_mode_of_travel\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`events_mode_of_travel_order_idx\` ON \`events_mode_of_travel\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`events_mode_of_travel_parent_idx\` ON \`events_mode_of_travel\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`events\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`subtitle\` text,
  	\`description\` text,
  	\`start_date\` text,
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
  	\`content\` text,
  	\`slug\` text,
  	\`type\` text,
  	\`tenant_id\` integer,
  	\`content_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
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
  await db.run(sql`CREATE INDEX \`events__status_idx\` ON \`events\` (\`_status\`);`)
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
  await db.run(sql`CREATE TABLE \`_events_v_version_blocks_in_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`block_type\` text,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_events_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_events_v_version_blocks_in_content_order_idx\` ON \`_events_v_version_blocks_in_content\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_events_v_version_blocks_in_content_parent_id_idx\` ON \`_events_v_version_blocks_in_content\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_events_v_version_mode_of_travel\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_events_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_events_v_version_mode_of_travel_order_idx\` ON \`_events_v_version_mode_of_travel\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_events_v_version_mode_of_travel_parent_idx\` ON \`_events_v_version_mode_of_travel\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_events_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_subtitle\` text,
  	\`version_description\` text,
  	\`version_start_date\` text,
  	\`version_end_date\` text,
  	\`version_timezone\` text,
  	\`version_location_is_virtual\` integer DEFAULT false,
  	\`version_location_place_name\` text,
  	\`version_location_address\` text,
  	\`version_location_city\` text,
  	\`version_location_state\` text,
  	\`version_location_zip\` text,
  	\`version_location_country\` text DEFAULT 'US',
  	\`version_location_coordinates\` text,
  	\`version_location_virtual_url\` text,
  	\`version_location_extra_info\` text,
  	\`version_featured_image_id\` integer,
  	\`version_thumbnail_image_id\` integer,
  	\`version_registration_url\` text,
  	\`version_external_event_url\` text,
  	\`version_registration_deadline\` text,
  	\`version_capacity\` numeric,
  	\`version_cost\` numeric,
  	\`version_skill_rating\` text,
  	\`version_content\` text,
  	\`version_slug\` text,
  	\`version_type\` text,
  	\`version_tenant_id\` integer,
  	\`version_content_hash\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_thumbnail_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_events_v_parent_idx\` ON \`_events_v\` (\`parent_id\`);`)
  await db.run(
    sql`CREATE INDEX \`_events_v_version_version_featured_image_idx\` ON \`_events_v\` (\`version_featured_image_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_events_v_version_version_thumbnail_image_idx\` ON \`_events_v\` (\`version_thumbnail_image_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_events_v_version_version_slug_idx\` ON \`_events_v\` (\`version_slug\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_events_v_version_version_tenant_idx\` ON \`_events_v\` (\`version_tenant_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_events_v_version_version_updated_at_idx\` ON \`_events_v\` (\`version_updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_events_v_version_version_created_at_idx\` ON \`_events_v\` (\`version_created_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_events_v_version_version__status_idx\` ON \`_events_v\` (\`version__status\`);`,
  )
  await db.run(sql`CREATE INDEX \`_events_v_created_at_idx\` ON \`_events_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_events_v_updated_at_idx\` ON \`_events_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_events_v_latest_idx\` ON \`_events_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_events_v_autosave_idx\` ON \`_events_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`_events_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`event_groups_id\` integer,
  	\`event_tags_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_events_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`event_groups_id\`) REFERENCES \`event_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`event_tags_id\`) REFERENCES \`event_tags\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_events_v_rels_order_idx\` ON \`_events_v_rels\` (\`order\`);`)
  await db.run(
    sql`CREATE INDEX \`_events_v_rels_parent_idx\` ON \`_events_v_rels\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`_events_v_rels_path_idx\` ON \`_events_v_rels\` (\`path\`);`)
  await db.run(
    sql`CREATE INDEX \`_events_v_rels_event_groups_id_idx\` ON \`_events_v_rels\` (\`event_groups_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_events_v_rels_event_tags_id_idx\` ON \`_events_v_rels\` (\`event_tags_id\`);`,
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
  await db.run(sql`CREATE TABLE \`providers_states_serviced\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`providers\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`providers_states_serviced_order_idx\` ON \`providers_states_serviced\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`providers_states_serviced_parent_idx\` ON \`providers_states_serviced\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`providers_course_types\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`providers\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`providers_course_types_order_idx\` ON \`providers_course_types\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`providers_course_types_parent_idx\` ON \`providers_course_types\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`providers\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`details\` text,
  	\`email\` text,
  	\`phone\` text,
  	\`website\` text,
  	\`location_address\` text,
  	\`location_city\` text,
  	\`location_state\` text,
  	\`location_zip\` text,
  	\`location_country\` text DEFAULT 'US',
  	\`slug\` text,
  	\`notification_email\` text,
  	\`content_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE INDEX \`providers_slug_idx\` ON \`providers\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`providers_updated_at_idx\` ON \`providers\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`providers_created_at_idx\` ON \`providers\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`providers__status_idx\` ON \`providers\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_providers_v_version_states_serviced\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_providers_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_providers_v_version_states_serviced_order_idx\` ON \`_providers_v_version_states_serviced\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_providers_v_version_states_serviced_parent_idx\` ON \`_providers_v_version_states_serviced\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_providers_v_version_course_types\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_providers_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_providers_v_version_course_types_order_idx\` ON \`_providers_v_version_course_types\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_providers_v_version_course_types_parent_idx\` ON \`_providers_v_version_course_types\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_providers_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_name\` text,
  	\`version_details\` text,
  	\`version_email\` text,
  	\`version_phone\` text,
  	\`version_website\` text,
  	\`version_location_address\` text,
  	\`version_location_city\` text,
  	\`version_location_state\` text,
  	\`version_location_zip\` text,
  	\`version_location_country\` text DEFAULT 'US',
  	\`version_slug\` text,
  	\`version_notification_email\` text,
  	\`version_content_hash\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`providers\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_providers_v_parent_idx\` ON \`_providers_v\` (\`parent_id\`);`)
  await db.run(
    sql`CREATE INDEX \`_providers_v_version_version_slug_idx\` ON \`_providers_v\` (\`version_slug\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_providers_v_version_version_updated_at_idx\` ON \`_providers_v\` (\`version_updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_providers_v_version_version_created_at_idx\` ON \`_providers_v\` (\`version_created_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_providers_v_version_version__status_idx\` ON \`_providers_v\` (\`version__status\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_providers_v_created_at_idx\` ON \`_providers_v\` (\`created_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_providers_v_updated_at_idx\` ON \`_providers_v\` (\`updated_at\`);`,
  )
  await db.run(sql`CREATE INDEX \`_providers_v_latest_idx\` ON \`_providers_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_providers_v_autosave_idx\` ON \`_providers_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`courses_mode_of_travel\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`courses\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`courses_mode_of_travel_order_idx\` ON \`courses_mode_of_travel\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`courses_mode_of_travel_parent_idx\` ON \`courses_mode_of_travel\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`courses_affinity_groups\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`courses\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`courses_affinity_groups_order_idx\` ON \`courses_affinity_groups\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`courses_affinity_groups_parent_idx\` ON \`courses_affinity_groups\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`courses\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`subtitle\` text,
  	\`description\` text,
  	\`start_date\` text,
  	\`end_date\` text,
  	\`timezone\` text,
  	\`location_place_name\` text,
  	\`location_address\` text,
  	\`location_city\` text,
  	\`location_state\` text,
  	\`location_zip\` text,
  	\`location_country\` text DEFAULT 'US',
  	\`location_coordinates\` text,
  	\`course_url\` text,
  	\`registration_deadline\` text,
  	\`slug\` text,
  	\`course_type\` text,
  	\`provider_id\` integer,
  	\`content_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`provider_id\`) REFERENCES \`providers\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`courses_slug_idx\` ON \`courses\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`courses_provider_idx\` ON \`courses\` (\`provider_id\`);`)
  await db.run(sql`CREATE INDEX \`courses_updated_at_idx\` ON \`courses\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`courses_created_at_idx\` ON \`courses\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`courses__status_idx\` ON \`courses\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_courses_v_version_mode_of_travel\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_courses_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_courses_v_version_mode_of_travel_order_idx\` ON \`_courses_v_version_mode_of_travel\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_courses_v_version_mode_of_travel_parent_idx\` ON \`_courses_v_version_mode_of_travel\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_courses_v_version_affinity_groups\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_courses_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_courses_v_version_affinity_groups_order_idx\` ON \`_courses_v_version_affinity_groups\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_courses_v_version_affinity_groups_parent_idx\` ON \`_courses_v_version_affinity_groups\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_courses_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_subtitle\` text,
  	\`version_description\` text,
  	\`version_start_date\` text,
  	\`version_end_date\` text,
  	\`version_timezone\` text,
  	\`version_location_place_name\` text,
  	\`version_location_address\` text,
  	\`version_location_city\` text,
  	\`version_location_state\` text,
  	\`version_location_zip\` text,
  	\`version_location_country\` text DEFAULT 'US',
  	\`version_location_coordinates\` text,
  	\`version_course_url\` text,
  	\`version_registration_deadline\` text,
  	\`version_slug\` text,
  	\`version_course_type\` text,
  	\`version_provider_id\` integer,
  	\`version_content_hash\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`courses\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_provider_id\`) REFERENCES \`providers\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_courses_v_parent_idx\` ON \`_courses_v\` (\`parent_id\`);`)
  await db.run(
    sql`CREATE INDEX \`_courses_v_version_version_slug_idx\` ON \`_courses_v\` (\`version_slug\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_courses_v_version_version_provider_idx\` ON \`_courses_v\` (\`version_provider_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_courses_v_version_version_updated_at_idx\` ON \`_courses_v\` (\`version_updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_courses_v_version_version_created_at_idx\` ON \`_courses_v\` (\`version_created_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_courses_v_version_version__status_idx\` ON \`_courses_v\` (\`version__status\`);`,
  )
  await db.run(sql`CREATE INDEX \`_courses_v_created_at_idx\` ON \`_courses_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_courses_v_updated_at_idx\` ON \`_courses_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_courses_v_latest_idx\` ON \`_courses_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_courses_v_autosave_idx\` ON \`_courses_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`users_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`providers_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`providers_id\`) REFERENCES \`providers\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_rels_order_idx\` ON \`users_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`users_rels_parent_idx\` ON \`users_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`users_rels_path_idx\` ON \`users_rels\` (\`path\`);`)
  await db.run(
    sql`CREATE INDEX \`users_rels_providers_id_idx\` ON \`users_rels\` (\`providers_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`a3_management\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`provider_manager_role_id\` integer,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`provider_manager_role_id\`) REFERENCES \`global_roles\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`CREATE INDEX \`a3_management_provider_manager_role_idx\` ON \`a3_management\` (\`provider_manager_role_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_rels\` ADD \`event_groups_id\` integer REFERENCES event_groups(id);`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_rels\` ADD \`event_tags_id\` integer REFERENCES event_tags(id);`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_rels\` ADD \`events_id\` integer REFERENCES events(id);`,
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
    sql`ALTER TABLE \`_home_pages_v_rels\` ADD \`event_groups_id\` integer REFERENCES event_groups(id);`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_rels\` ADD \`event_tags_id\` integer REFERENCES event_tags(id);`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_rels\` ADD \`events_id\` integer REFERENCES events(id);`,
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
    sql`ALTER TABLE \`pages_rels\` ADD \`event_groups_id\` integer REFERENCES event_groups(id);`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_rels\` ADD \`event_tags_id\` integer REFERENCES event_tags(id);`,
  )
  await db.run(sql`ALTER TABLE \`pages_rels\` ADD \`events_id\` integer REFERENCES events(id);`)
  await db.run(
    sql`CREATE INDEX \`pages_rels_event_groups_id_idx\` ON \`pages_rels\` (\`event_groups_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_rels_event_tags_id_idx\` ON \`pages_rels\` (\`event_tags_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`pages_rels_events_id_idx\` ON \`pages_rels\` (\`events_id\`);`)
  await db.run(
    sql`ALTER TABLE \`_pages_v_rels\` ADD \`event_groups_id\` integer REFERENCES event_groups(id);`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_rels\` ADD \`event_tags_id\` integer REFERENCES event_tags(id);`,
  )
  await db.run(sql`ALTER TABLE \`_pages_v_rels\` ADD \`events_id\` integer REFERENCES events(id);`)
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
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`events_id\` integer REFERENCES events(id);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`event_groups_id\` integer REFERENCES event_groups(id);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`event_tags_id\` integer REFERENCES event_tags(id);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`providers_id\` integer REFERENCES providers(id);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`courses_id\` integer REFERENCES courses(id);`,
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
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_providers_id_idx\` ON \`payload_locked_documents_rels\` (\`providers_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_courses_id_idx\` ON \`payload_locked_documents_rels\` (\`courses_id\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`filterByEventTypes\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_event_list\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_single_event\`;`)
  await db.run(sql`DROP TABLE \`home_pages_blocks_event_table\`;`)
  await db.run(sql`DROP TABLE \`_filterByEventTypes_v\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_event_list\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_single_event\`;`)
  await db.run(sql`DROP TABLE \`_home_pages_v_blocks_event_table\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_event_list\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_event_table\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_single_event\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_event_list\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_event_table\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_single_event\`;`)
  await db.run(sql`DROP TABLE \`events_blocks_in_content\`;`)
  await db.run(sql`DROP TABLE \`events_mode_of_travel\`;`)
  await db.run(sql`DROP TABLE \`events\`;`)
  await db.run(sql`DROP TABLE \`events_rels\`;`)
  await db.run(sql`DROP TABLE \`_events_v_version_blocks_in_content\`;`)
  await db.run(sql`DROP TABLE \`_events_v_version_mode_of_travel\`;`)
  await db.run(sql`DROP TABLE \`_events_v\`;`)
  await db.run(sql`DROP TABLE \`_events_v_rels\`;`)
  await db.run(sql`DROP TABLE \`event_groups\`;`)
  await db.run(sql`DROP TABLE \`event_tags\`;`)
  await db.run(sql`DROP TABLE \`providers_states_serviced\`;`)
  await db.run(sql`DROP TABLE \`providers_course_types\`;`)
  await db.run(sql`DROP TABLE \`providers\`;`)
  await db.run(sql`DROP TABLE \`_providers_v_version_states_serviced\`;`)
  await db.run(sql`DROP TABLE \`_providers_v_version_course_types\`;`)
  await db.run(sql`DROP TABLE \`_providers_v\`;`)
  await db.run(sql`DROP TABLE \`courses_mode_of_travel\`;`)
  await db.run(sql`DROP TABLE \`courses_affinity_groups\`;`)
  await db.run(sql`DROP TABLE \`courses\`;`)
  await db.run(sql`DROP TABLE \`_courses_v_version_mode_of_travel\`;`)
  await db.run(sql`DROP TABLE \`_courses_v_version_affinity_groups\`;`)
  await db.run(sql`DROP TABLE \`_courses_v\`;`)
  await db.run(sql`DROP TABLE \`users_rels\`;`)
  await db.run(sql`DROP TABLE \`a3_management\`;`)
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
