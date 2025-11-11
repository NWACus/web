import { CheckboxFilter, CheckboxFilterProps } from '@/components/filters/CheckboxFilter'
import { stateOptions } from '@/fields/location/states'

export const StatesFilter = (props?: Partial<CheckboxFilterProps>) => {
  return (
    <CheckboxFilter
      title="State"
      urlParam="states"
      options={stateOptions}
      maxHeight="max-h-64"
      {...props}
    />
  )
}
