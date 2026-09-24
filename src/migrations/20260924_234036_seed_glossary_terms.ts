import { seedGlossaryTerms } from '@/services/glossary/seedGlossaryTerms'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-sqlite'

/**
 * The legacy forecast widget's 82 glossary terms. Idempotent: a term that exists is left alone.
 * Locally the seed script does this instead, because push mode never runs migrations.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const seeded = await seedGlossaryTerms(payload, undefined, req)
  payload.logger.info(seeded, 'glossary terms seeded')
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // No-op: the terms are content now, and the schema rollback in the prior migration drops the
  // table with them.
  payload.logger.info('No rollback for the glossary terms seed')
}
