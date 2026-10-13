import { CheckboxFilter, CheckboxFilterProps } from '@/components/filters/CheckboxFilter'
import { affinityGroupOptions } from '@/fields/affinityGroupField'

export const AffinityGroupsFilter = (props?: Partial<CheckboxFilterProps>) => {
  return (
    <CheckboxFilter
      title="Affinity Groups"
      urlParam="affinityGroups"
      options={affinityGroupOptions}
      {...props}
    />
  )
}
