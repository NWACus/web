import type { CollectionBeforeValidateHook } from 'payload'
import { ValidationError } from 'payload'

import { courseTypesData } from '@/constants/courseTypes'
import type { Course } from '@/payload-types'

function relationshipId(value: Course['provider'] | null | undefined): number | undefined {
  if (typeof value === 'number') return value
  return value?.id
}

/**
 * The error for a Course Type its Provider isn't approved to offer, or null when it is approved.
 */
export function unapprovedCourseTypeError(
  courseType: string,
  provider: { name: string; courseTypes?: string[] | null },
): string | null {
  if (provider.courseTypes?.includes(courseType)) return null
  const label = courseTypesData.find((type) => type.value === courseType)?.label ?? courseType
  return `${provider.name} is not approved to offer ${label} courses.`
}

/**
 * Enforces Approved Course Types on every write path, not just the admin dropdown. Only checked
 * when the Course is created or its Course Type or Provider changes, so Courses that predate the
 * rule stay editable.
 */
export const requireApprovedCourseType: CollectionBeforeValidateHook<Course> = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (!data) return data

  const courseType = data.courseType ?? originalDoc?.courseType
  const providerId = relationshipId(data.provider ?? originalDoc?.provider)
  if (!courseType || providerId === undefined) return data

  const changed =
    operation === 'create' ||
    courseType !== originalDoc?.courseType ||
    providerId !== relationshipId(originalDoc?.provider)
  if (!changed) return data

  const provider = await req.payload.findByID({
    collection: 'providers',
    id: providerId,
    depth: 0,
    draft: true,
    select: { name: true, courseTypes: true },
    req,
  })
  const message = unapprovedCourseTypeError(courseType, provider)
  if (message) {
    throw new ValidationError(
      { collection: 'courses', errors: [{ path: 'courseType', message }] },
      req.t,
    )
  }

  return data
}
