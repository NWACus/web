'use client'

import { CheckboxFilter } from '@/components/filters/CheckboxFilter'

const affinityGroupsOptions = [
  { label: 'LGBTQ+', value: 'lgbtq' },
  { label: "Women's Specific", value: 'womens-specific' },
  { label: 'Youth Specific', value: 'youth-specific' },
]

export const CoursesAffinityFilter = () => {
  return (
    <CheckboxFilter
      title="Affinity Group"
      urlParam="affinityGroups"
      options={affinityGroupsOptions}
    />
  )
}
