import { CheckboxFilter, CheckboxFilterProps } from '@/components/filters/CheckboxFilter'

type ProviderOption = {
  label: string
  value: string
}

type ProvidersFilterProps = {
  providers: ProviderOption[]
} & Partial<CheckboxFilterProps>

export const ProvidersFilter = ({ providers, ...props }: ProvidersFilterProps) => {
  return (
    <CheckboxFilter
      title="Provider"
      urlParam="providers"
      options={providers}
      maxHeight="max-h-64"
      enableSearch
      searchPlaceholder="Search providers..."
      {...props}
    />
  )
}
