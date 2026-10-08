/**
 * Forecaster HTML gets its typography from `forecastProse.ts`, so a new surface that writes its own
 * `prose` class list would bring back the typography plugin's blockquote quote marks (Forecast-112).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { forecastProse, noBlockquoteQuotes } from '@/components/forecast/forecastProse'

const FORECAST_DIR = resolve(process.cwd(), 'src/components/forecast')

// A class-string literal that turns on the typography plugin: a quote or backtick, then `prose`.
const PROSE_CLASS_LITERAL = /['"`]prose\b/

function componentFiles(): string[] {
  return readdirSync(FORECAST_DIR)
    .filter((name) => name.endsWith('.tsx'))
    .map((name) => join(FORECAST_DIR, name))
}

describe('forecast prose', () => {
  it('suppresses blockquote quote marks in the shared class list', () => {
    expect(forecastProse.split(' ')).toContain(noBlockquoteQuotes)
  })

  it('is the only way a forecast component turns on prose', () => {
    const offenders = componentFiles().filter((file) => {
      const source = readFileSync(file, 'utf8')
      return PROSE_CLASS_LITERAL.test(source) && !source.includes('noBlockquoteQuotes')
    })
    expect(offenders).toEqual([])
  })
})
