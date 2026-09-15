import { typesetWeatherValue } from '@/components/forecast/weatherUnits'

describe('typesetWeatherValue', () => {
  describe('threads a symbol unit into the numbers', () => {
    it.each([
      // [value, unit, printed value, trailing unit]
      ['20 to 25', 'F', '20° to 25° ', 'F'],
      ['-3 to 3', 'F', '-3° to 3° ', 'F'],
      ['8', 'F', '8°', 'F'],
      ['28', '°F', '28°', 'F'],
      ['5-10', '"', '5"-10"', null],
      ['0.4 to 0.9', '"', '0.4" to 0.9"', null],
      ['0', '"', '0"', null],
    ])('%s (%s)', (value, unit, expected, trailing) => {
      expect(typesetWeatherValue(value, unit)).toEqual({
        value: expected.trimEnd(),
        trailingUnit: trailing,
      })
    })

    it('keeps the separator the forecaster typed, so a negative low stays legible', () => {
      expect(typesetWeatherValue('-3-2', 'F')).toEqual({ value: '-3°-2°', trailingUnit: 'F' })
    })
  })

  describe('leaves the unit trailing when it cannot be threaded', () => {
    it.each([
      // Word units read correctly after the whole value.
      ['17', 'mph'],
      ['6.0', 'in'],
      // BTAC packs a snow/water pair into one cell.
      ['6.0 / 0.36', 'in'],
      // Values a forecaster wrote out rather than measured.
      ['Trace to 2', '"'],
      ['@ 5am: 30 to 41° F | Max: 36 to 47° F', 'F'],
    ])('%s (%s)', (value, unit) => {
      expect(typesetWeatherValue(value, unit)).toEqual({ value, trailingUnit: unit })
    })
  })

  describe('prints no unit at all', () => {
    it.each([
      ['Overcast', null],
      ['SW', undefined],
      ['', 'F'],
      ['-', '"'],
      [null, 'F'],
    ])('%s (%s)', (value, unit) => {
      expect(typesetWeatherValue(value, unit).trailingUnit).toBeNull()
    })

    it('passes a null value through as an empty string', () => {
      expect(typesetWeatherValue(null, 'F').value).toBe('')
    })
  })
})
