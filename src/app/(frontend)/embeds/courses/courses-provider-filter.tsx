'use client'

import { CheckboxFilter } from '@/components/filters/CheckboxFilter'

type Provider = {
  id: number
  name: string
}

type Props = {
  providers: Provider[]
}

export const CoursesProviderFilter = ({ providers }: Props) => {
  const options = providers.map((provider) => ({
    label: provider.name,
    value: String(provider.id),
  }))

  return (
    <CheckboxFilter title="Provider" urlParam="providers" options={options} maxHeight="max-h-64" />
  )
}
