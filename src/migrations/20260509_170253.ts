import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-sqlite'

// No-op: layout column was already added by 20260502_155913.
// This migration exists only to advance the snapshot so migrate:create
// no longer detects layout as missing.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {}
