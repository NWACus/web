import type { Event } from '@/payload-types'
import type { CollectionBeforeValidateHook } from 'payload'
import { ValidationError } from 'payload'
import { eventSubTypesData } from '../constants'

export const validateEvent: CollectionBeforeValidateHook<Event> = async ({
  data,
  operation,
  req,
}) => {
  if (!data) {
    return data
  }

  const errors: Array<{ message: string; path: string }> = []

  // Must have one of avalanche center (tenant) or provider
  // Skip this check for create operations without required fields (initial form load)
  const hasTenant = data.tenant !== null && data.tenant !== undefined
  const hasProvider = data.provider !== null && data.provider !== undefined

  // Only validate tenant/provider requirement when we have actual data being submitted
  // For create operations, if neither is set, it might be initial form load with defaults not yet applied
  const isActualSubmission = operation === 'update' || (data.title && data.startDate)

  if (!hasTenant && !hasProvider && isActualSubmission) {
    errors.push({
      message: 'Event must have either an Avalanche Center (Tenant) or a Provider.',
      path: 'tenant',
    })
    errors.push({
      message: 'Event must have either an Avalanche Center (Tenant) or a Provider.',
      path: 'provider',
    })
  }

  // subType must be valid for type and for the provider
  if (data.type && data.subType) {
    // Check if the subType is valid for the selected event type
    const validSubTypesForType = eventSubTypesData.filter(
      (subType) => subType.eventType === data.type,
    )

    const isValidSubType = validSubTypesForType.some((subType) => subType.value === data.subType)

    if (!isValidSubType) {
      errors.push({
        message: `Sub-type "${data.subType}" is not valid for event type "${data.type}".`,
        path: 'subType',
      })
    }
  }

  // If event has a provider and is a course by external provider, check provider's approved course types
  if (data.provider && data.type === 'course-by-external-provider' && data.subType) {
    const providerId = typeof data.provider === 'number' ? data.provider : data.provider.id

    // Fetch the provider to check their approved course types
    const provider = await req.payload.findByID({
      collection: 'providers',
      id: providerId,
    })

    if (provider && Array.isArray(provider.courseTypes)) {
      const isApprovedCourseType = provider.courseTypes.includes(data.subType)

      if (!isApprovedCourseType) {
        errors.push({
          message: `This provider is not approved to create "${data.subType}" courses.`,
          path: 'subType',
        })
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError({
      errors,
    })
  }

  return data
}
