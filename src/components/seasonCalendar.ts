import { seasonOfDate, seasonWindow } from '@/services/nac/forecastArchive'
import { format, startOfMonth } from 'date-fns'

/** "2025–26". */
export function seasonName(season: number): string {
  return `${season - 1}–${String(season).slice(2)}`
}

/** The seasons from today's back to `firstSeason`, newest first. */
export function seasonsSince(firstSeason: number, today: string): number[] {
  const seasons: number[] = []
  for (let season = seasonOfDate(today); season >= firstSeason; season -= 1) seasons.push(season)
  return seasons
}

/** The days a season offers as `yyyy-MM-dd`: all of it, or up to today while it's in progress. */
export function seasonBounds(season: number, today: string): { from: string; to: string } {
  const { from, to } = seasonWindow(season)
  return { from, to: to < today ? to : today }
}

export function seasonOfMonth(month: Date): number {
  return seasonOfDate(format(month, 'yyyy-MM-dd'))
}

/** The same calendar month in another season, or the latest month that has started. */
export function sameMonthInSeason(month: Date, season: number, today: Date): Date {
  const year = month.getMonth() >= 8 ? season - 1 : season
  const target = new Date(year, month.getMonth(), 1)
  return target > today ? startOfMonth(today) : target
}
