'use client'

import { CheckboxFilter } from '@/components/filters/CheckboxFilter'

const modesOfTravelOptions = [
  { label: 'Ski', value: 'ski' },
  { label: 'Splitboard', value: 'splitboard' },
  { label: 'Motorized', value: 'motorized' },
  { label: 'Snowshoe', value: 'snowshoe' },
]

export const CoursesTravelFilter = () => {
  return (
    <CheckboxFilter
      title="Mode of Travel"
      urlParam="modesOfTravel"
      options={modesOfTravelOptions}
    />
  )
}
