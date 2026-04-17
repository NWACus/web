import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`nac_widgets_config\` ADD \`dev_mode\` integer DEFAULT false NOT NULL;`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`nac_widgets_config\` DROP COLUMN \`dev_mode\`;`)
}
