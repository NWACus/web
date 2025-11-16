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

    const result = await payload.findDistinct({
      collection: 'courses',
      field: 'location.state',
      sort: 'location.state',
    })

    const states = result.values.map((value) => {
      // @ts-expect-error Payload returns { location: { state: string }}[] but the type returned is actually { 'location.state': string }[]
      const stateCode = value['location.state']
      return {
        label: getStateLabel(stateCode),
        value: stateCode,
      }
    })

    return { states }
  } catch (error) {
    Sentry.captureException(error)
    return { states: [] }
  }
}
