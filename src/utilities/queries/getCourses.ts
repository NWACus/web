import { COURSES_LIMIT } from '@/constants/defaults'
import type { Course } from '@/payload-types'
import config from '@/payload.config'
import * as Sentry from '@sentry/nextjs'
import type { Where } from 'payload'
import { getPayload } from 'payload'

export interface GetCoursesParams {
  offset?: number | null
  limit?: number | null
  types?: string | null
  providers?: string | null
  states?: string | null
  affinityGroups?: string | null
  modesOfTravel?: string | null
  startDate?: string | null
  endDate?: string | null
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
    const { types, providers, states, affinityGroups, modesOfTravel, startDate, endDate } = params

    const offset = params.offset || 0
    const limit = params.limit || COURSES_LIMIT

    const conditions: Where[] = [
      {
        _status: {
          equals: 'published',
        },
      },
    ]

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

    if (providers) {
      const selectedProviders = providers.split(',').filter(Boolean).map(Number)
      if (selectedProviders.length > 0) {
        conditions.push({
          'provider.slug': {
            in: selectedProviders,
          },
        })
      }
    }

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

    const where: Where = conditions.length > 0 ? { and: conditions } : {}

    const result = await payload.find({
      collection: 'courses',
      where,
      limit: limit || undefined,
      page: limit && offset ? Math.floor(offset / limit) + 1 : undefined,
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
