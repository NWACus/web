'use client'

import { CheckboxFilter } from '@/components/filters/CheckboxFilter'
import type { Tag } from '@/payload-types'

type Props = {
  tags: Tag[]
}

export const BlogTagsFilter = ({ tags }: Props) => {
  const options = tags.map((tag) => ({
    label: tag.title,
    value: tag.slug,
  }))

  return (
    <CheckboxFilter
      title="Filter by tag"
      urlParam="tags"
      options={options}
      defaultOpen={true}
      showBottomBorder={false}
      enableSearch={tags.length > 10}
      searchPlaceholder="Search tags..."
    />
  )
}
