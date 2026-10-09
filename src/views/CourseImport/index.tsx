import type { AdminViewServerProps } from 'payload'

import { isUser } from '@/utilities/isUser'
import { canImportCourses } from '@/utilities/rbac/canImportCourses'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { CourseImportForm } from './CourseImportForm'

export async function CourseImport({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult
  const user = isUser(req.user) ? req.user : undefined
  const allowed = user ? await canImportCourses(req.payload, user) : false
  const content = allowed ? (
    <CourseImportForm />
  ) : (
    <p>Only Provider Managers can run a Course Import.</p>
  )

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={user}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <div className="py-8">
          <div className="doc-header__header">
            <h1 className="doc-header__title">Course Import</h1>
          </div>
          <div className="doc-header__after-header">
            <p className="custom-view-description mb-10">
              Load the season&apos;s course spreadsheet into the national catalog. Nothing is saved
              until you review the preview and confirm.
            </p>
          </div>
          {content}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
