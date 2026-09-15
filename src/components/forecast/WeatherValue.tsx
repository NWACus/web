/**
 * A weather cell's value beside its row's unit — shared by both table formats so a temperature
 * reads the same whichever shape the center's product arrives in.
 */
import { typesetWeatherValue } from './weatherUnits'

interface WeatherValueProps {
  value: string | null | undefined
  unit: string | null | undefined
}

export function WeatherValue({ value, unit }: WeatherValueProps) {
  const typeset = typesetWeatherValue(value, unit)

  return (
    <>
      {typeset.value}
      {typeset.trailingUnit && (
        <span className="text-muted-foreground"> {typeset.trailingUnit}</span>
      )}
    </>
  )
}
