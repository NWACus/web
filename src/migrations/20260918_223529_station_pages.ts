import type { StationPage } from '@/payload-types'
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'
import type { BasePayload, Where } from 'payload'

const TENANT_SLUG = 'nwac'
// Every seeded station is one of NWAC's own loggers.
const SOURCE = 'nwac'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`station_pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`tenant_id\` integer NOT NULL,
  	\`display_name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`stations\` text DEFAULT '[]',
  	\`archived\` integer DEFAULT false,
  	\`content_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`station_pages_tenant_idx\` ON \`station_pages\` (\`tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`station_pages_slug_idx\` ON \`station_pages\` (\`slug\`);`)
  await db.run(
    sql`CREATE INDEX \`station_pages_updated_at_idx\` ON \`station_pages\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`station_pages_created_at_idx\` ON \`station_pages\` (\`created_at\`);`,
  )
  await db.run(
    sql`CREATE UNIQUE INDEX \`tenant_slug_idx\` ON \`station_pages\` (\`tenant_id\`,\`slug\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`station_pages_id\` integer REFERENCES station_pages(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_station_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`station_pages_id\`);`,
  )
  // NWAC's 32 pages, as ported from the legacy site. Idempotent: a page that
  // exists is left alone. Locally the seed script does this instead, because
  // this runs before any tenant exists.
  const { docs: tenants } = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: TENANT_SLUG } },
    limit: 1,
    depth: 0,
    req,
  })
  const tenant = tenants[0]
  if (!tenant) {
    payload.logger.info(`No ${TENANT_SLUG} tenant; station pages not seeded`)
    return
  }
  const seeded = await seedStationPages(payload, tenant.id)
  payload.logger.info(seeded, 'station pages seeded')
  const granted = await grantStationAccess(payload)
  payload.logger.info({ roles: granted }, 'Admin roles granted station page access')
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`station_pages\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
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
  	\`forms_id\` integer,
  	\`form_submissions_id\` integer,
  	\`payload_mcp_api_keys_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`home_pages_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`built_in_pages_id\`) REFERENCES \`built_in_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
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
  	FOREIGN KEY (\`forms_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`payload_mcp_api_keys_id\`) REFERENCES \`payload_mcp_api_keys\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "home_pages_id", "built_in_pages_id", "pages_id", "posts_id", "media_id", "galleries_id", "documents_id", "announcements_id", "sponsors_id", "tags_id", "events_id", "event_groups_id", "event_tags_id", "providers_id", "courses_id", "biographies_id", "teams_id", "users_id", "roles_id", "role_assignments_id", "global_roles_id", "global_role_assignments_id", "tenants_id", "navigations_id", "settings_id", "redirects_id", "forms_id", "form_submissions_id", "payload_mcp_api_keys_id") SELECT "id", "order", "parent_id", "path", "home_pages_id", "built_in_pages_id", "pages_id", "posts_id", "media_id", "galleries_id", "documents_id", "announcements_id", "sponsors_id", "tags_id", "events_id", "event_groups_id", "event_tags_id", "providers_id", "courses_id", "biographies_id", "teams_id", "users_id", "roles_id", "role_assignments_id", "global_roles_id", "global_role_assignments_id", "tenants_id", "navigations_id", "settings_id", "redirects_id", "forms_id", "form_submissions_id", "payload_mcp_api_keys_id" FROM \`payload_locked_documents_rels\`;`,
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
    sql`CREATE INDEX \`payload_locked_documents_rels_forms_id_idx\` ON \`payload_locked_documents_rels\` (\`forms_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_form_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`form_submissions_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_payload_mcp_api_keys_id_idx\` ON \`payload_locked_documents_rels\` (\`payload_mcp_api_keys_id\`);`,
  )
}

// The 32 pages and their station assignments as they stood in the retired
// src/constants/weatherStations.ts registry. Names and elevations are never
// stored; the pages and the admin picker read them from SnowObs. The local
// seed script imports this too, because locally the migration runs before
// any tenant exists.

export type SeedStationPage = {
  slug: string
  displayName: string
  archived: boolean
  /** Old nwac.us /weatherdata/<slug>/now/ path, kept for a future redirect. */
  legacySlug: string
  /** SnowObs station ids in page order. */
  stids: string[]
}

export const NWAC_STATION_PAGES: SeedStationPage[] = [
  {
    slug: 'hurricane-ridge',
    displayName: 'Hurricane Ridge',
    archived: false,
    legacySlug: 'hurricaneridge',
    stids: ['4'],
  },
  {
    slug: 'mt-baker-ski-area',
    displayName: 'Mt. Baker Ski Area',
    archived: false,
    legacySlug: 'mtbakerskiarea',
    stids: ['6', '5'],
  },
  {
    slug: 'newhalem',
    displayName: 'Newhalem',
    archived: false,
    legacySlug: 'newhalem',
    stids: ['59'],
  },
  {
    slug: 'white-chuck',
    displayName: 'White Chuck',
    archived: false,
    legacySlug: 'whitechuck',
    stids: ['57'],
  },
  {
    slug: 'berne',
    displayName: 'Berne',
    archived: false,
    legacySlug: 'bernemaintenancestation',
    stids: ['12'],
  },
  {
    slug: 'stevens-pass-schmidt-haus',
    displayName: 'Stevens Pass - WSDOT Schmidt Haus',
    archived: false,
    legacySlug: 'stevenshwy2',
    stids: ['13'],
  },
  {
    slug: 'stevens-pass-brooks',
    displayName: 'Stevens Pass Ski Area - Brooks Chair',
    archived: false,
    legacySlug: 'brookssnow',
    stids: ['50'],
  },
  {
    slug: 'grace-lakes',
    displayName: 'Grace Lakes & Old Faithful',
    archived: false,
    legacySlug: 'gracelakes',
    stids: ['14', '51'],
  },
  {
    slug: 'stevens-ski-area',
    displayName: 'Stevens Pass Ski Area - Tye Mill Chair, Skyline Chair',
    archived: false,
    legacySlug: 'stevensskiarea',
    stids: ['18', '17'],
  },
  {
    slug: 'alpental',
    displayName: 'Alpental Ski Area',
    archived: false,
    legacySlug: 'alpental',
    stids: ['3', '2', '1'],
  },
  {
    slug: 'mt-washington',
    displayName: 'Mt. Washington',
    archived: false,
    legacySlug: 'mtwashington',
    stids: ['20'],
  },
  {
    slug: 'snoqualmie-pass',
    displayName: 'Snoqualmie Pass',
    archived: false,
    legacySlug: 'snoqualmiepass',
    stids: ['22', '23', '21'],
  },
  {
    slug: 'crystal-mt-ski-area',
    displayName: 'Crystal Mt. Ski Area',
    archived: false,
    legacySlug: 'crystalskiarea',
    stids: ['29', '28'],
  },
  {
    slug: 'crystal-mt-green-valley',
    displayName: 'Crystal Mt. - Green Valley & Campbell Basin',
    archived: false,
    legacySlug: 'crystalgrnvalley',
    stids: ['27', '54'],
  },
  {
    slug: 'camp-muir',
    displayName: 'Camp Muir',
    archived: false,
    legacySlug: 'campmuir',
    stids: ['34'],
  },
  {
    slug: 'paradise',
    displayName: 'Paradise',
    archived: false,
    legacySlug: 'paradise',
    stids: ['35', '36'],
  },
  {
    slug: 'sunrise',
    displayName: 'Sunrise',
    archived: false,
    legacySlug: 'sunrise',
    stids: ['30', '31'],
  },
  {
    slug: 'chinook-pass',
    displayName: 'Chinook Pass',
    archived: false,
    legacySlug: 'chinookpass',
    stids: ['32', '33'],
  },
  {
    slug: 'white-pass',
    displayName: 'White Pass Ski Area',
    archived: false,
    legacySlug: 'whitepass',
    stids: ['39', '37', '49'],
  },
  {
    slug: 'mt-st-helens',
    displayName: 'Mt. St. Helens',
    archived: true,
    legacySlug: 'mtsthelens',
    stids: ['40'],
  },
  {
    slug: 'mazama',
    displayName: 'Mazama',
    archived: false,
    legacySlug: 'mazama',
    stids: ['7'],
  },
  {
    slug: 'washington-pass',
    displayName: 'Washington Pass',
    archived: false,
    legacySlug: 'washingtonpass',
    stids: ['9', '8'],
  },
  {
    slug: 'blewett-pass',
    displayName: 'Blewett Pass',
    archived: false,
    legacySlug: 'blewettpass',
    stids: ['48'],
  },
  {
    slug: 'dirtyface-mtn',
    displayName: 'Dirtyface Mt',
    archived: false,
    legacySlug: 'dirtyfacemtn',
    stids: ['10'],
  },
  {
    slug: 'lake-wenatchee',
    displayName: 'Lake Wenatchee',
    archived: false,
    legacySlug: 'lakewenatchee',
    stids: ['11'],
  },
  {
    slug: 'mission-ridge',
    displayName: 'Mission Ridge Ski Area',
    archived: false,
    legacySlug: 'missionridge',
    stids: ['25', '26', '24'],
  },
  {
    slug: 'tumwater',
    displayName: 'Tumwater Mt. & Leavenworth',
    archived: false,
    legacySlug: 'tumwater',
    stids: ['19', '53'],
  },
  {
    slug: 'mt-hood-meadows',
    displayName: 'Mt. Hood Meadows Ski Area',
    archived: false,
    legacySlug: 'mthoodmeadows',
    stids: ['42', '43'],
  },
  {
    slug: 'cascade-express',
    displayName: 'Mt. Hood Meadows - Cascade Express',
    archived: false,
    legacySlug: 'cascade_express',
    stids: ['41'],
  },
  {
    slug: 'timberline-base',
    displayName: 'Timberline Lodge',
    archived: false,
    legacySlug: 'timberlinebase',
    stids: ['44', '56'],
  },
  {
    slug: 'timberline-upper',
    displayName: 'Timberline - Magic Mile Chair',
    archived: false,
    legacySlug: 'timberlineupper',
    stids: ['45'],
  },
  {
    slug: 'skibowl-ski-area',
    displayName: 'Skibowl Ski Area - Government Camp',
    archived: false,
    legacySlug: 'skibowlgovtcamp',
    stids: ['47', '46'],
  },
]

export type SeedResult = { pagesCreated: number }

type StationPageSeed = Pick<StationPage, 'slug' | 'displayName' | 'archived' | 'stations'> & {
  tenant: number
}

// The slice of the local API the seed uses. Payload's client satisfies it, and
// so does a plain object in a test, with no type assertion.
export type SeedPayload = {
  find(args: {
    collection: 'stationPages'
    where: Where
    limit: number
    depth: number
    select: { slug: true }
  }): Promise<{ docs: { slug: string }[] }>
  create(args: {
    collection: 'stationPages'
    data: StationPageSeed
    context: { disableRevalidate: boolean }
  }): Promise<unknown>
}

/**
 * Put NWAC's station pages in place for one tenant, once: a page that already
 * exists is left exactly as the admin has it.
 *
 * Runs inside migrations (deployed environments) and the local seed script,
 * which passes a short list, so it disables the cache hooks -- there is no
 * request to revalidate against.
 */
export async function seedStationPages(
  payload: SeedPayload,
  tenantId: number,
  pages: SeedStationPage[] = NWAC_STATION_PAGES,
): Promise<SeedResult> {
  const context = { disableRevalidate: true }
  const { docs: existing } = await payload.find({
    collection: 'stationPages',
    where: { tenant: { equals: tenantId } },
    limit: 1000,
    depth: 0,
    select: { slug: true },
  })
  const present = new Set(existing.map((page) => page.slug))

  const result: SeedResult = { pagesCreated: 0 }
  for (const page of pages) {
    if (present.has(page.slug)) continue
    await payload.create({
      collection: 'stationPages',
      data: {
        tenant: tenantId,
        slug: page.slug,
        displayName: page.displayName,
        archived: page.archived,
        stations: page.stids.map((stid) => ({ stid, source: SOURCE })),
      },
      context,
    })
    result.pagesCreated++
  }

  return result
}

const STATION_COLLECTIONS = ['stationPages']

/**
 * Let each center's Admin role manage the station pages.
 *
 * Tenant roles list their collections explicitly, so a new collection is
 * invisible to every existing Admin until someone edits the role. Finds the
 * rule that already grants full access to `settings` (the marker of an admin
 * rule) and appends the station collections to it, once. Super admins are
 * unaffected: their `*` already covers everything.
 */
export async function grantStationAccess(payload: BasePayload): Promise<number> {
  const { docs: roles } = await payload.find({
    collection: 'roles',
    where: { name: { equals: 'Admin' } },
    limit: 1000,
    depth: 0,
  })

  let updated = 0
  for (const role of roles) {
    let changed = false
    const rules = (role.rules ?? []).map((rule) => {
      const collections = rule.collections ?? []
      const isAdminRule = collections.includes('settings') && (rule.actions ?? []).includes('*')
      const missing = STATION_COLLECTIONS.filter((slug) => !collections.includes(slug))
      if (!isAdminRule || missing.length === 0) return rule
      changed = true
      return { ...rule, collections: [...collections, ...missing] }
    })
    if (!changed) continue
    await payload.update({ collection: 'roles', id: role.id, data: { rules } })
    updated++
  }
  return updated
}
