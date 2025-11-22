import { CheckboxFilter, CheckboxFilterProps } from '@/components/filters/CheckboxFilter'
import { stateOptions } from '@/fields/location/states'

type State = {
  label: string
  value: string
}

type StatesFilterProps = {
  states?: State[]
} & Partial<CheckboxFilterProps>

export const StatesFilter = ({ states, ...props }: StatesFilterProps = {}) => {
  const options = states || stateOptions

  return (
    <CheckboxFilter
      title="State"
      urlParam="states"
      options={options}
      maxHeight="max-h-64"
      {...props}
    />
  )
}
