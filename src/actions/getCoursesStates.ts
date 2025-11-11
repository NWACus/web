'use server'

import { getStateLabel } from '@/fields/location/states'
import config from '@/payload.config'
import * as Sentry from '@sentry/nextjs'
import { getPayload } from 'payload'

export interface GetCoursesStatesResults {
  states: { label: string; value: string }[]
}

export async function getCoursesStates(): Promise<GetCoursesStatesResults> {
  try {
    const payload = await getPayload({ config })

    // Query all to get unique states
    const result = await payload.find({
      collection: 'courses',
      limit: 10000,
      select: {
        location: true,
      },
    })

    // Extract unique state values
    const uniqueStates = new Set<string>()
    result.docs.forEach((doc) => {
      if (doc.location?.state) {
        uniqueStates.add(doc.location.state)
      }
    })

    // Convert to array and sort alphabetically by label
    const states = Array.from(uniqueStates)
      .map((value) => ({
        label: getStateLabel(value),
        value,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    return { states }
  } catch (error) {
    Sentry.captureException(error)
    return { states: [] }
  }
}
