import { CheckboxFilter, CheckboxFilterProps } from '@/components/filters/CheckboxFilter'

type Provider = {
  id: number
  name: string
}

type ProvidersFilterProps = {
  providers: Provider[]
} & Partial<CheckboxFilterProps>

export const ProvidersFilter = ({ providers, ...props }: ProvidersFilterProps) => {
  const options = providers.map((provider) => ({
    label: provider.name,
    value: String(provider.id),
  }))

  return (
    <CheckboxFilter
      title="Provider"
      urlParam="providers"
      options={options}
      maxHeight="max-h-64"
      {...props}
    />
  )
}
