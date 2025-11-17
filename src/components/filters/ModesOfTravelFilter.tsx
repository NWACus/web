import { CheckboxFilter, CheckboxFilterProps } from '@/components/filters/CheckboxFilter'
import { modeOfTravelOptions } from '@/fields/modeOfTravelField'

export const ModesOfTravelFilter = (props?: Partial<CheckboxFilterProps>) => {
  return (
    <CheckboxFilter
      title="Mode of Travel"
      urlParam="modesOfTravel"
      options={modeOfTravelOptions}
      {...props}
    />
  )
}
