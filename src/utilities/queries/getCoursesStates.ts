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
      where: {
        _status: {
          equals: 'published',
        },
      },
    })

    const states = result.values.map((value) => {
      // @ts-expect-error Payload returns { location: { state: string }}[] but the type returned is actually { 'location.state': string }[]
      const stateCode = value['location.state']
      return {
        label: getStateLabel(stateCode),
        value: stateCode,
      }
    })

    // Move international to the bottom of the list
    const intlIndex = states.findIndex((s) => s.value === 'INTL')
    if (intlIndex !== -1) {
      const [intlItem] = states.splice(intlIndex, 1)
      states.push(intlItem)
    }

    return { states }
  } catch (error) {
    Sentry.captureException(error)
    return { states: [] }
  }
}
