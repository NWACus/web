import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`members\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`email\` text NOT NULL,
  	\`email_verified\` integer DEFAULT false,
  	\`image\` text,
  	\`is_anonymous\` integer DEFAULT false,
  	\`preferences\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`members_email_idx\` ON \`members\` (\`email\`);`)
  await db.run(sql`CREATE INDEX \`members_updated_at_idx\` ON \`members\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`members_created_at_idx\` ON \`members\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`memberships\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`member_id\` text NOT NULL,
  	\`tenant_id\` integer NOT NULL,
  	\`kind\` text DEFAULT 'site' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`member_id\`) REFERENCES \`members\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`memberships_member_idx\` ON \`memberships\` (\`member_id\`);`)
  await db.run(sql`CREATE INDEX \`memberships_tenant_idx\` ON \`memberships\` (\`tenant_id\`);`)
  await db.run(
    sql`CREATE INDEX \`memberships_updated_at_idx\` ON \`memberships\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`memberships_created_at_idx\` ON \`memberships\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`devices\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`install_id\` text NOT NULL,
  	\`secret_hash\` text,
  	\`push_token\` text,
  	\`platform\` text,
  	\`member_id\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`member_id\`) REFERENCES \`members\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`devices_install_id_idx\` ON \`devices\` (\`install_id\`);`)
  await db.run(sql`CREATE INDEX \`devices_member_idx\` ON \`devices\` (\`member_id\`);`)
  await db.run(sql`CREATE INDEX \`devices_updated_at_idx\` ON \`devices\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`devices_created_at_idx\` ON \`devices\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`subscriptions\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`member_id\` text NOT NULL,
  	\`tenant_id\` integer NOT NULL,
  	\`zone\` text NOT NULL,
  	\`category\` text NOT NULL,
  	\`channel\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`member_id\`) REFERENCES \`members\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`subscriptions_member_idx\` ON \`subscriptions\` (\`member_id\`);`)
  await db.run(sql`CREATE INDEX \`subscriptions_tenant_idx\` ON \`subscriptions\` (\`tenant_id\`);`)
  await db.run(
    sql`CREATE INDEX \`subscriptions_updated_at_idx\` ON \`subscriptions\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`subscriptions_created_at_idx\` ON \`subscriptions\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`deliveries\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`member_id\` text NOT NULL,
  	\`device_id\` integer,
  	\`subscription_id\` integer,
  	\`title\` text NOT NULL,
  	\`sent_at\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`member_id\`) REFERENCES \`members\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`device_id\`) REFERENCES \`devices\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`subscription_id\`) REFERENCES \`subscriptions\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`deliveries_member_idx\` ON \`deliveries\` (\`member_id\`);`)
  await db.run(sql`CREATE INDEX \`deliveries_device_idx\` ON \`deliveries\` (\`device_id\`);`)
  await db.run(
    sql`CREATE INDEX \`deliveries_subscription_idx\` ON \`deliveries\` (\`subscription_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`deliveries_updated_at_idx\` ON \`deliveries\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`deliveries_created_at_idx\` ON \`deliveries\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`members_sessions\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`token\` text NOT NULL,
  	\`member_id\` text NOT NULL,
  	\`expires_at\` text NOT NULL,
  	\`ip_address\` text,
  	\`user_agent\` text,
  	\`scope\` text DEFAULT 'full' NOT NULL,
  	\`site_host\` text,
  	\`created_at\` text NOT NULL,
  	\`updated_at\` text NOT NULL,
  	FOREIGN KEY (\`member_id\`) REFERENCES \`members\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX \`members_sessions_token_idx\` ON \`members_sessions\` (\`token\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`members_sessions_member_idx\` ON \`members_sessions\` (\`member_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`members_accounts\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`account_id\` text NOT NULL,
  	\`provider_id\` text NOT NULL,
  	\`member_id\` text NOT NULL,
  	\`access_token\` text,
  	\`refresh_token\` text,
  	\`id_token\` text,
  	\`access_token_expires_at\` text,
  	\`refresh_token_expires_at\` text,
  	\`scope\` text,
  	\`password\` text,
  	\`created_at\` text NOT NULL,
  	\`updated_at\` text NOT NULL,
  	FOREIGN KEY (\`member_id\`) REFERENCES \`members\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`members_accounts_member_idx\` ON \`members_accounts\` (\`member_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`members_accounts_provider_idx\` ON \`members_accounts\` (\`provider_id\`,\`account_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`members_verifications\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`identifier\` text NOT NULL,
  	\`value\` text NOT NULL,
  	\`expires_at\` text NOT NULL,
  	\`created_at\` text NOT NULL,
  	\`updated_at\` text NOT NULL
  );
  `)
  await db.run(
    sql`CREATE INDEX \`members_verifications_identifier_idx\` ON \`members_verifications\` (\`identifier\`);`,
  )
  await db.run(sql`CREATE TABLE \`members_rate_limits\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`count\` integer NOT NULL,
  	\`last_request\` integer NOT NULL
  );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX \`members_rate_limits_key_idx\` ON \`members_rate_limits\` (\`key\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`members_id\` text REFERENCES members(id) ON DELETE cascade;`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`memberships_id\` integer REFERENCES memberships(id) ON DELETE cascade;`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`devices_id\` integer REFERENCES devices(id) ON DELETE cascade;`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`subscriptions_id\` integer REFERENCES subscriptions(id) ON DELETE cascade;`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`deliveries_id\` integer REFERENCES deliveries(id) ON DELETE cascade;`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_members_id_idx\` ON \`payload_locked_documents_rels\` (\`members_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_memberships_id_idx\` ON \`payload_locked_documents_rels\` (\`memberships_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_devices_id_idx\` ON \`payload_locked_documents_rels\` (\`devices_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_subscriptions_id_idx\` ON \`payload_locked_documents_rels\` (\`subscriptions_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_deliveries_id_idx\` ON \`payload_locked_documents_rels\` (\`deliveries_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_preferences_rels\` ADD \`members_id\` text REFERENCES members(id) ON DELETE cascade;`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_members_id_idx\` ON \`payload_preferences_rels\` (\`members_id\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`members\`;`)
  await db.run(sql`DROP TABLE \`memberships\`;`)
  await db.run(sql`DROP TABLE \`devices\`;`)
  await db.run(sql`DROP TABLE \`subscriptions\`;`)
  await db.run(sql`DROP TABLE \`deliveries\`;`)
  await db.run(sql`DROP TABLE \`members_sessions\`;`)
  await db.run(sql`DROP TABLE \`members_accounts\`;`)
  await db.run(sql`DROP TABLE \`members_verifications\`;`)
  await db.run(sql`DROP TABLE \`members_rate_limits\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`home_pages_id\` integer,
  	\`built_in_pages_id\` integer,
  	\`pages_id\` integer,
  	\`station_pages_id\` integer,
  	\`posts_id\` integer,
  	\`media_id\` integer,
  	\`galleries_id\` integer,
  	\`documents_id\` integer,
  	\`announcements_id\` integer,
  	\`sponsors_id\` integer,
  	\`tags_id\` integer,
  	\`events_id\` integer,
  	\`event_groups_id\` integer,
  	\`event_tags_id\` integer,
  	\`providers_id\` integer,
  	\`courses_id\` integer,
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
  	\`shared_media_id\` integer,
  	\`glossary_terms_id\` integer,
  	\`forms_id\` integer,
  	\`form_submissions_id\` integer,
  	\`payload_mcp_api_keys_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`home_pages_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`built_in_pages_id\`) REFERENCES \`built_in_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`station_pages_id\`) REFERENCES \`station_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`galleries_id\`) REFERENCES \`galleries\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`documents_id\`) REFERENCES \`documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`announcements_id\`) REFERENCES \`announcements\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sponsors_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`events_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`event_groups_id\`) REFERENCES \`event_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`event_tags_id\`) REFERENCES \`event_tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`providers_id\`) REFERENCES \`providers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`courses_id\`) REFERENCES \`courses\`(\`id\`) ON UPDATE no action ON DELETE cascade,
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
  	FOREIGN KEY (\`shared_media_id\`) REFERENCES \`shared_media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`glossary_terms_id\`) REFERENCES \`glossary_terms\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`forms_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`payload_mcp_api_keys_id\`) REFERENCES \`payload_mcp_api_keys\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "home_pages_id", "built_in_pages_id", "pages_id", "station_pages_id", "posts_id", "media_id", "galleries_id", "documents_id", "announcements_id", "sponsors_id", "tags_id", "events_id", "event_groups_id", "event_tags_id", "providers_id", "courses_id", "biographies_id", "teams_id", "users_id", "roles_id", "role_assignments_id", "global_roles_id", "global_role_assignments_id", "tenants_id", "navigations_id", "settings_id", "redirects_id", "shared_media_id", "glossary_terms_id", "forms_id", "form_submissions_id", "payload_mcp_api_keys_id") SELECT "id", "order", "parent_id", "path", "home_pages_id", "built_in_pages_id", "pages_id", "station_pages_id", "posts_id", "media_id", "galleries_id", "documents_id", "announcements_id", "sponsors_id", "tags_id", "events_id", "event_groups_id", "event_tags_id", "providers_id", "courses_id", "biographies_id", "teams_id", "users_id", "roles_id", "role_assignments_id", "global_roles_id", "global_role_assignments_id", "tenants_id", "navigations_id", "settings_id", "redirects_id", "shared_media_id", "glossary_terms_id", "forms_id", "form_submissions_id", "payload_mcp_api_keys_id" FROM \`payload_locked_documents_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`,
  )
  await db.run(sql`PRAGMA foreign_keys=ON;`)
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
    sql`CREATE INDEX \`payload_locked_documents_rels_station_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`station_pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`posts_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_galleries_id_idx\` ON \`payload_locked_documents_rels\` (\`galleries_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_documents_id_idx\` ON \`payload_locked_documents_rels\` (\`documents_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_announcements_id_idx\` ON \`payload_locked_documents_rels\` (\`announcements_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_sponsors_id_idx\` ON \`payload_locked_documents_rels\` (\`sponsors_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_tags_id_idx\` ON \`payload_locked_documents_rels\` (\`tags_id\`);`,
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
    sql`CREATE INDEX \`payload_locked_documents_rels_shared_media_id_idx\` ON \`payload_locked_documents_rels\` (\`shared_media_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_glossary_terms_id_idx\` ON \`payload_locked_documents_rels\` (\`glossary_terms_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_forms_id_idx\` ON \`payload_locked_documents_rels\` (\`forms_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_form_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`form_submissions_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_payload_mcp_api_keys_id_idx\` ON \`payload_locked_documents_rels\` (\`payload_mcp_api_keys_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`__new_payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`payload_mcp_api_keys_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`payload_mcp_api_keys_id\`) REFERENCES \`payload_mcp_api_keys\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_payload_preferences_rels\`("id", "order", "parent_id", "path", "users_id", "payload_mcp_api_keys_id") SELECT "id", "order", "parent_id", "path", "users_id", "payload_mcp_api_keys_id" FROM \`payload_preferences_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_payload_preferences_rels\` RENAME TO \`payload_preferences_rels\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_payload_mcp_api_keys_id_idx\` ON \`payload_preferences_rels\` (\`payload_mcp_api_keys_id\`);`,
  )
}
