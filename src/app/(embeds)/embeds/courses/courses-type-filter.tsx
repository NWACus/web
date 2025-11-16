'use client'

import { courseTypesData } from '@/collections/Courses/constants'
import { CheckboxFilter } from '@/components/filters/CheckboxFilter'

export const CoursesTypeFilter = () => {
  return <CheckboxFilter title="Course Type" urlParam="types" options={courseTypesData} />
}
