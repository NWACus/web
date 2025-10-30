import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // No actual change needed. See 20251029_173505_upgrade_payload_3_61_1_explanation.md.
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // No actual change needed.
}
