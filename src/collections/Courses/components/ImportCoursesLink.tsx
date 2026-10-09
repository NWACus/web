import { isUser } from '@/utilities/isUser'
import { canImportCourses } from '@/utilities/rbac/canImportCourses'
import type { BeforeListServerProps } from 'payload'
import { formatAdminURL } from 'payload/shared'
import { ImportCoursesButton } from './ImportCoursesButton'

export async function ImportCoursesLink({ payload, user }: BeforeListServerProps) {
  if (!isUser(user) || !(await canImportCourses(payload, user))) return null

  return (
    <ImportCoursesButton
      url={formatAdminURL({ adminRoute: payload.config.routes.admin, path: '/course-import' })}
    />
  )
}
