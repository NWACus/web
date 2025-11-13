'use client'

import { CheckboxFilter } from '@/components/filters/CheckboxFilter'

type Props = {
  tags: { label: string; value: string }[]
}

export const EventsTagsFilter = ({ tags }: Props) => {
  return <CheckboxFilter title="Tags" urlParam="tags" options={tags} defaultOpen={true} />
}
