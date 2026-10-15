import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

// TEMPORARY: exercises db:diff expected changes against a throwaway prod clone. Revert before merging.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`UPDATE \`tenants\` SET \`updated_at\` = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');`)
  await db.run(sql`DROP INDEX IF EXISTS \`tenants_created_at_idx\`;`)
  await db.run(
    sql`DELETE FROM \`posts_rels\` WHERE \`id\` = (SELECT min(\`id\`) FROM \`posts_rels\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`tenants_created_at_idx\` ON \`tenants\` (\`created_at\`);`,
  )
}
