'use client'

import { CheckboxFilter } from '@/components/filters/CheckboxFilter'

type Props = {
  groups: { label: string; value: string }[]
}

export const EventsGroupsFilter = ({ groups }: Props) => {
  return <CheckboxFilter title="Groups" urlParam="groups" options={groups} defaultOpen={true} />
}
