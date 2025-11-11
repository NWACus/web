'use server'

import type { Course } from '@/payload-types'
import config from '@/payload.config'
import * as Sentry from '@sentry/nextjs'
import type { Where } from 'payload'
import { getPayload } from 'payload'

export interface GetCoursesParams {
  offset?: number
  limit?: number
  types?: string
  providers?: string
  states?: string
  affinityGroups?: string
  modesOfTravel?: string
  startDate?: string
  endDate?: string
}

export interface GetCoursesResult {
  courses: Course[]
  hasMore: boolean
  total: number
  error?: string
}

export async function getCourses(params: GetCoursesParams): Promise<GetCoursesResult> {
  const payload = await getPayload({ config })

  try {
    const {
      offset = 0,
      limit = 10,
      types,
      providers,
      states,
      affinityGroups,
      modesOfTravel,
      startDate,
      endDate,
    } = params

    // Build where conditions
    const conditions: Where[] = []

    // Filter by course types
    if (types) {
      const selectedTypes = types.split(',').filter(Boolean)
      if (selectedTypes.length > 0) {
        conditions.push({
          courseType: {
            in: selectedTypes,
          },
        })
      }
    }

    // Filter by providers
    if (providers) {
      const selectedProviders = providers.split(',').filter(Boolean).map(Number)
      if (selectedProviders.length > 0) {
        conditions.push({
          provider: {
            in: selectedProviders,
          },
        })
      }
    }

    // Filter by states
    if (states) {
      const selectedStates = states.split(',').filter(Boolean)
      if (selectedStates.length > 0) {
        conditions.push({
          'location.state': {
            in: selectedStates,
          },
        })
      }
    }

    // Filter by affinity groups
    if (affinityGroups) {
      const selectedAffinityGroups = affinityGroups.split(',').filter(Boolean)
      if (selectedAffinityGroups.length > 0) {
        conditions.push({
          affinityGroups: {
            in: selectedAffinityGroups,
          },
        })
      }
    }

    // Filter by modes of travel
    if (modesOfTravel) {
      const selectedModes = modesOfTravel.split(',').filter(Boolean)
      if (selectedModes.length > 0) {
        conditions.push({
          modeOfTravel: {
            in: selectedModes,
          },
        })
      }
    }

    // Filter by date range
    if (startDate && endDate) {
      conditions.push({
        startDate: {
          greater_than_equal: startDate,
          less_than_equal: endDate,
        },
      })
    } else if (startDate) {
      conditions.push({
        startDate: {
          greater_than_equal: startDate,
        },
      })
    } else if (endDate) {
      conditions.push({
        startDate: {
          less_than_equal: endDate,
        },
      })
    } else {
      // If no date filters are provided, default to showing only upcoming courses
      const today = new Date().toISOString()
      conditions.push({
        or: [
          {
            endDate: {
              greater_than_equal: today,
            },
          },
          {
            and: [
              {
                endDate: {
                  exists: false,
                },
              },
              {
                startDate: {
                  greater_than_equal: today,
                },
              },
            ],
          },
        ],
      })
    }

    // Always filter for published courses
    conditions.push({
      _status: {
        equals: 'published',
      },
    })

    const where: Where = conditions.length > 0 ? { and: conditions } : {}

    const result = await payload.find({
      collection: 'courses',
      where,
      limit,
      page: Math.floor(offset / limit) + 1,
      sort: 'startDate',
      depth: 1,
    })

    return {
      courses: result.docs,
      hasMore: result.hasNextPage,
      total: result.totalDocs,
    }
  } catch (error) {
    payload.logger.error(error, 'Failed to getCourses')
    Sentry.captureException(error)
    return {
      courses: [],
      hasMore: false,
      total: 0,
      error: 'Failed to load courses. Please reload the page or clear your filters.',
    }
  }
}
