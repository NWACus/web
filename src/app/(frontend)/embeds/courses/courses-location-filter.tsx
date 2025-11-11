'use client'

import { CheckboxFilter } from '@/components/filters/CheckboxFilter'
import { stateOptions } from '@/fields/location/states'

export const CoursesLocationFilter = () => {
  return (
    <CheckboxFilter
      title="Location"
      urlParam="states"
      options={stateOptions}
      maxHeight="max-h-64"
    />
  )
}
