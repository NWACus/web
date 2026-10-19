import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

// The table's reading order when this migration was written, inlined so a later change to
// TABLE_VARIABLE_ORDER can't change what it does.
const READING_ORDER = [
  'air_temp',
  'relative_humidity',
  'wind_speed_min',
  'wind_speed',
  'wind_gust',
  'wind_direction',
  'precip_accum_one_hour',
  'snow_depth_24h',
  'snow_depth',
  'intermittent_snow',
  'solar_radiation',
  'pressure',
  'equip_temperature',
]

type Ref = { stid: string; source: string; columns?: string[] }

function parseStations(value: string | null): Ref[] {
  const parsed: unknown = value ? JSON.parse(value) : []
  return Array.isArray(parsed)
    ? parsed.filter(
        (s): s is Ref =>
          typeof s === 'object' &&
          s !== null &&
          typeof s.stid === 'string' &&
          typeof s.source === 'string',
      )
    : []
}

function readingsByPage(rows: { parent_id: number; value: string | null }[]) {
  const byPage = new Map<number, string[]>()
  for (const row of rows) {
    if (!row.value) continue
    byPage.set(row.parent_id, [...(byPage.get(row.parent_id) ?? []), row.value])
  }
  return byPage
}

// A page's readings move onto each station; a reordering becomes one order entry per station and
// reading. Exported for tests.
export function moveReadings(stationsJson: string | null, readings: string[]) {
  const stations = parseStations(stationsJson).map(({ stid, source }) => ({
    stid,
    source,
    columns: READING_ORDER.filter((r) => readings.includes(r)),
  }))
  const inDefaultOrder = readings.every(
    (r, i) => i === 0 || READING_ORDER.indexOf(readings[i - 1]) < READING_ORDER.indexOf(r),
  )
  const columnOrder = inDefaultOrder
    ? []
    : readings.flatMap((variable) =>
        stations.map(({ stid, source }) => ({ stid, source, variable })),
      )
  return { stations, columnOrder }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`station_pages\` ADD \`column_order\` text DEFAULT '[]';`)

  const pages = await db.all<{ id: number; stations: string | null }>(
    sql`SELECT \`id\`, \`stations\` FROM \`station_pages\`;`,
  )
  const chosen = readingsByPage(
    await db.all<{ parent_id: number; value: string | null }>(
      sql`SELECT \`parent_id\`, \`value\` FROM \`station_pages_columns\` ORDER BY \`parent_id\`, \`order\`;`,
    ),
  )

  for (const page of pages) {
    const readings = chosen.get(page.id)
    if (!readings) continue
    const { stations, columnOrder } = moveReadings(page.stations, readings)
    await db.run(
      sql`UPDATE \`station_pages\` SET \`stations\` = ${JSON.stringify(stations)}, \`column_order\` = ${JSON.stringify(columnOrder)} WHERE \`id\` = ${page.id};`,
    )
  }

  await db.run(sql`DROP TABLE \`station_pages_columns\`;`)
}

// Lossy: the page gets every reading any of its stations chose, in the default
// order, and the column order is dropped.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`station_pages_columns\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`station_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`station_pages_columns_order_idx\` ON \`station_pages_columns\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`station_pages_columns_parent_idx\` ON \`station_pages_columns\` (\`parent_id\`);`,
  )

  const pages = await db.all<{ id: number; stations: string | null }>(
    sql`SELECT \`id\`, \`stations\` FROM \`station_pages\`;`,
  )
  let id = 1
  for (const page of pages) {
    const stations = parseStations(page.stations)
    const readings = new Set(stations.flatMap((s) => s.columns ?? []))
    const order = READING_ORDER.filter((r) => readings.has(r))
    for (const [i, value] of order.entries()) {
      await db.run(
        sql`INSERT INTO \`station_pages_columns\` (\`order\`, \`parent_id\`, \`value\`, \`id\`) VALUES (${i + 1}, ${page.id}, ${value}, ${id++});`,
      )
    }
    const refs = stations.map(({ stid, source }) => ({ stid, source }))
    await db.run(
      sql`UPDATE \`station_pages\` SET \`stations\` = ${JSON.stringify(refs)} WHERE \`id\` = ${page.id};`,
    )
  }

  await db.run(sql`ALTER TABLE \`station_pages\` DROP COLUMN \`column_order\`;`)
}
