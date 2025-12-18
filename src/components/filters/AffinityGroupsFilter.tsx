import { CheckboxFilter, CheckboxFilterProps } from '@/components/filters/CheckboxFilter'
import { affinityGroupOptions } from '@/fields/affinityGroupField'

export const AffinityGroupsFilter = (props?: Partial<CheckboxFilterProps>) => {
  return (
    <CheckboxFilter
      title="Interest Group"
      urlParam="affinityGroups"
      options={affinityGroupOptions}
      {...props}
    />
  )
}
