'use server'

import type { User } from '@/payload-types'
import type { CatalogProvider, CourseImportData } from '@/services/courseImport/planCourseImport'
import {
  coursesToCreate,
  courseToImportData,
  createAllOrNone,
  importablePlan,
  importSummary,
  planFromCsvText,
  type ImportResult,
  type PreviewResult,
} from '@/services/courseImport/runCourseImport'
import { getUser } from '@/utilities/isUser'
import { canImportCourses } from '@/utilities/rbac/canImportCourses'
import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, type Payload } from 'payload'

const NOT_ALLOWED = 'Only Provider Managers can run a Course Import.'

async function authorize() {
  const payload = await getPayload({ config })
  const user = getUser(await payload.auth({ headers: await headers() }))
  if (!user || !(await canImportCourses(payload, user))) return null
  return { payload, user }
}

/** Always re-read: the preview and the import each plan against the current catalog. */
async function planAgainstCatalog(payload: Payload, text: unknown): Promise<PreviewResult> {
  const [{ docs: providerDocs }, { docs: courseDocs }] = await Promise.all([
    // Only published Providers count: an unpublished Provider hasn't been approved by A3
    payload.find({
      collection: 'providers',
      where: { _status: { equals: 'published' } },
      pagination: false,
      depth: 0,
      select: { name: true, courseTypes: true },
    }),
    payload.find({ collection: 'courses', pagination: false, depth: 0, draft: true }),
  ])
  const providers: CatalogProvider[] = providerDocs.map((provider) => ({
    id: provider.id,
    name: provider.name,
    courseTypes: provider.courseTypes || [],
  }))
  return planFromCsvText({ text, providers, existingCourses: courseDocs.map(courseToImportData) })
}

/** Creates as the acting user, so collection access and validation still apply. */
function courseWriter(payload: Payload, user: User) {
  return {
    create: async (data: CourseImportData) => {
      const doc = await payload.create({
        collection: 'courses',
        data: { ...data, _status: 'published' },
        draft: false,
        user,
        overrideAccess: false,
      })
      return doc.id
    },
    remove: async (ids: number[]) => {
      await payload.delete({ collection: 'courses', where: { id: { in: ids } } })
    },
  }
}

export async function previewCourseImport(text: string): Promise<PreviewResult> {
  const auth = await authorize()
  if (!auth) return { ok: false, error: NOT_ALLOWED }
  return planAgainstCatalog(auth.payload, text)
}

export async function runCourseImport(
  text: string,
  includeDuplicateRows: number[],
): Promise<ImportResult> {
  const auth = await authorize()
  if (!auth) return { ok: false, error: NOT_ALLOWED }
  const { payload, user } = auth

  const preview = importablePlan(await planAgainstCatalog(payload, text))
  if (!preview.ok) return preview
  const { plan } = preview

  const courses = coursesToCreate(plan, includeDuplicateRows)
  const outcome = await createAllOrNone({ courses, ...courseWriter(payload, user) })
  if (!outcome.ok) {
    payload.logger.error(`Course Import failed on row ${outcome.row}: ${outcome.message}`)
    return {
      ok: false,
      error: `Row ${outcome.row} couldn't be saved, so nothing was imported. ${outcome.message}`,
    }
  }

  return { ok: true, ...importSummary(plan, courses) }
}
