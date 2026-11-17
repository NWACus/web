// Better Auth's own tables, injected into Payload's Drizzle schema so Payload migrations stay
// the only migration system (ADR 026). Imports Payload's Drizzle re-export, never drizzle-orm.
import type { SQLiteSchemaHook } from '@payloadcms/db-sqlite'
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from '@payloadcms/db-sqlite/drizzle/sqlite-core'

type PayloadTable = Parameters<SQLiteSchemaHook>[0]['schema']['tables'][string]

/** Drizzle schema keys (and SQL table names) of the injected tables. */
export const MEMBER_AUTH_TABLES = {
  session: 'members_sessions',
  account: 'members_accounts',
  verification: 'members_verifications',
  rateLimit: 'members_rate_limits',
} as const

// Payload stores timestamps as ISO-8601 text; Better Auth's Drizzle adapter writes the same
// format to text columns, so these match the `created_at` column Payload gives `members`.
const timestamps = {
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}

export function buildMemberAuthTables(members: PayloadTable) {
  const memberRef = () =>
    text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' })

  const sessions = sqliteTable(
    MEMBER_AUTH_TABLES.session,
    {
      id: text('id').primaryKey(),
      token: text('token').notNull(),
      userId: memberRef(),
      expiresAt: text('expires_at').notNull(),
      ipAddress: text('ip_address'),
      userAgent: text('user_agent'),
      // 'full' on the apex and in AvyApp; 'site' for the limited sessions handed to center hosts
      scope: text('scope').notNull().default('full'),
      siteHost: text('site_host'),
      ...timestamps,
    },
    (t) => [
      uniqueIndex('members_sessions_token_idx').on(t.token),
      index('members_sessions_member_idx').on(t.userId),
    ],
  )

  const accounts = sqliteTable(
    MEMBER_AUTH_TABLES.account,
    {
      id: text('id').primaryKey(),
      accountId: text('account_id').notNull(),
      providerId: text('provider_id').notNull(),
      userId: memberRef(),
      accessToken: text('access_token'),
      refreshToken: text('refresh_token'),
      idToken: text('id_token'),
      accessTokenExpiresAt: text('access_token_expires_at'),
      refreshTokenExpiresAt: text('refresh_token_expires_at'),
      scope: text('scope'),
      password: text('password'),
      ...timestamps,
    },
    (t) => [
      index('members_accounts_member_idx').on(t.userId),
      index('members_accounts_provider_idx').on(t.providerId, t.accountId),
    ],
  )

  const verifications = sqliteTable(
    MEMBER_AUTH_TABLES.verification,
    {
      id: text('id').primaryKey(),
      identifier: text('identifier').notNull(),
      value: text('value').notNull(),
      expiresAt: text('expires_at').notNull(),
      ...timestamps,
    },
    (t) => [index('members_verifications_identifier_idx').on(t.identifier)],
  )

  const rateLimits = sqliteTable(
    MEMBER_AUTH_TABLES.rateLimit,
    {
      id: text('id').primaryKey(),
      key: text('key').notNull(),
      count: integer('count').notNull(),
      lastRequest: integer('last_request').notNull(),
    },
    (t) => [uniqueIndex('members_rate_limits_key_idx').on(t.key)],
  )

  return { sessions, accounts, verifications, rateLimits }
}

/**
 * Runs after Payload has built its own tables, so the session/account foreign keys can point at
 * the real `members` table. Anything added here is part of `adapter.schema`, which both dev push
 * and `migrate:create` read.
 */
export const injectMemberAuthTables: SQLiteSchemaHook = ({ schema }) => {
  const members = schema.tables.members
  if (!members) {
    throw new Error('injectMemberAuthTables: the members collection must be in the config')
  }
  const { sessions, accounts, verifications, rateLimits } = buildMemberAuthTables(members)
  return {
    ...schema,
    tables: {
      ...schema.tables,
      [MEMBER_AUTH_TABLES.session]: sessions,
      [MEMBER_AUTH_TABLES.account]: accounts,
      [MEMBER_AUTH_TABLES.verification]: verifications,
      [MEMBER_AUTH_TABLES.rateLimit]: rateLimits,
    },
  }
}
