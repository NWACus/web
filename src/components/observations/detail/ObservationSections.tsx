/**
 * The observation detail's panels after its header, each shown under the widget's conditions:
 * the summary always; avalanches, weather and snowpack only when the record has something for
 * them (problems are in `./ProblemsSection`).
 */
import { CloudSnow, Info, Snowflake, TriangleAlert } from 'lucide-react'

import type { ObservationInstability, ObservationWeather } from '@/services/nac/model/observation'
import {
  CLOUD_COVER,
  SNOW_AVAILABLE_FOR_TRANSPORT,
  WIND_LOADING,
  labelFor,
} from '@/services/nac/observations/options'

import { AvalanchesObservedBadge, InstabilityBadge, ObservationCard } from '../list/ObservationCard'
import { HtmlBlock, NotObserved, Section, TextBlock } from './DetailParts'
import type { ObservationDetailData } from './detailTypes'
import { MediaGallery } from './MediaGallery'

type Detail = ObservationDetailData

// ─── When each panel shows (the widget's `show*` computeds) ─────────────────

export function showsAvalanches(detail: Detail): boolean {
  return detail.avalanches.length > 0 || Boolean(detail.observation.avalanchesSummary)
}

export function showsWeather({ observation }: Detail): boolean {
  const { weather, weatherSummary } = observation
  return Boolean(weatherSummary) || Object.values(weather ?? {}).some((value) => value !== null)
}

export function showsSnowpack(detail: Detail): boolean {
  return Boolean(detail.snowpackHtml) || detail.snowpackGallery.length > 0
}

/** A titled block of submitter text, or nothing when there is none. */
function TitledText({ title, text }: { title: string; text: string | null }) {
  if (!text) return null
  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <TextBlock text={text} />
    </div>
  )
}

// ─── Summary ────────────────────────────────────────────────────────────────

type Sign = { text: string; tone: 'avalanche' | 'instability' }

function describedAs(label: string, description: string | null) {
  return description ? `${label} (${description})` : label
}

/** The widget's signs of instability, in its order. */
export function instabilitySigns(instability: ObservationInstability): Sign[] {
  const signs: [boolean, Sign][] = [
    [instability.avalanchesObserved, { text: 'Avalanches Observed', tone: 'avalanche' }],
    [instability.avalanchesTriggered, { text: 'Avalanches Triggered', tone: 'avalanche' }],
    [instability.avalanchesCaught, { text: 'Caught in Avalanche', tone: 'avalanche' }],
    [
      instability.cracking,
      {
        text: describedAs('Cracking Observed', instability.crackingDescription),
        tone: 'instability',
      },
    ],
    [
      instability.collapsing,
      {
        text: describedAs('Collapsing Observed', instability.collapsingDescription),
        tone: 'instability',
      },
    ],
  ]
  return signs.flatMap(([shown, sign]) => (shown ? [sign] : []))
}

function InstabilitySigns({ instability }: { instability: ObservationInstability }) {
  const signs = instabilitySigns(instability)
  // Only the three headline signs count: a record can't be "triggered" without "observed".
  const reported = instability.avalanchesObserved || instability.cracking || instability.collapsing
  if (!reported) return <p className="text-sm">None Reported</p>
  return (
    <ul className="flex flex-col items-start gap-1">
      {signs.map((sign) => (
        <li key={sign.text}>
          {sign.tone === 'avalanche' ? (
            <AvalanchesObservedBadge text={sign.text} />
          ) : (
            <InstabilityBadge text={sign.text} />
          )}
        </li>
      ))}
    </ul>
  )
}

export function SummarySection({ detail }: { detail: Detail }) {
  const { observation } = detail
  return (
    <Section icon={<Info className="h-5 w-5" />} title="Observation Summary">
      {detail.summaryHtml && <HtmlBlock html={detail.summaryHtml} />}
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-1 text-sm font-semibold uppercase">Signs of Instability</h3>
          <InstabilitySigns instability={observation.instability} />
        </div>
        <TitledText title="Instability Comments" text={observation.instabilitySummary} />
      </div>
    </Section>
  )
}

// ─── Avalanches ─────────────────────────────────────────────────────────────

export function AvalanchesSection({
  detail,
  hrefFor,
  onOpen,
}: {
  detail: Detail
  hrefFor: (id: string) => string
  onOpen?: (id: string) => void
}) {
  if (!showsAvalanches(detail)) return null
  return (
    <Section icon={<TriangleAlert className="h-5 w-5" />} title="Avalanches">
      <ul className="grid gap-3 md:grid-cols-2">
        {detail.avalanches.map((card) => (
          <li key={card.id}>
            <ObservationCard
              card={card}
              href={hrefFor(card.id)}
              highlighted={false}
              onOpen={onOpen && (() => onOpen(card.id))}
            />
          </li>
        ))}
      </ul>
      <TitledText title="Avalanche Summary" text={detail.observation.avalanchesSummary} />
    </Section>
  )
}

// ─── Weather ────────────────────────────────────────────────────────────────

const NO_WEATHER: ObservationWeather = {
  airTemp: null,
  cloudCover: null,
  windLoading: null,
  rainElevation: null,
  recentSnowfall: null,
  snowAvailableForTransport: null,
}

/** The widget's six weather readings, in its order, with the form's labels for its codes. */
export function weatherReadings(weather: ObservationWeather | null): [string, string | null][] {
  const reading = weather ?? NO_WEATHER
  return [
    ['Cloud Cover', labelFor(reading.cloudCover, CLOUD_COVER)],
    ['Temperature (F)', reading.airTemp],
    ['New or Recent Snowfall (cm)', reading.recentSnowfall],
    ['Rain/Snow Line', reading.rainElevation],
    [
      'Snow Available For Transport',
      labelFor(reading.snowAvailableForTransport, SNOW_AVAILABLE_FOR_TRANSPORT),
    ],
    ['Wind Loading', labelFor(reading.windLoading, WIND_LOADING)],
  ]
}

function WeatherValue({ value }: { value: string | null }) {
  return value ? <TextBlock text={value} /> : <NotObserved />
}

export function WeatherSection({ detail }: { detail: Detail }) {
  if (!showsWeather(detail)) return null
  const { weather, weatherSummary } = detail.observation
  return (
    <Section icon={<CloudSnow className="h-5 w-5" />} title="Weather">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {weatherReadings(weather).map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase text-muted-foreground">{label}</dt>
            <dd>
              <WeatherValue value={value} />
            </dd>
          </div>
        ))}
      </dl>
      <TitledText title="Weather Summary" text={weatherSummary} />
    </Section>
  )
}

// ─── Snowpack ───────────────────────────────────────────────────────────────

export function SnowpackSection({ detail }: { detail: Detail }) {
  if (!showsSnowpack(detail)) return null
  return (
    <Section icon={<Snowflake className="h-5 w-5" />} title="Snowpack">
      {detail.snowpackHtml && <HtmlBlock html={detail.snowpackHtml} />}
      <MediaGallery tiles={detail.snowpackGallery} lightbox={detail.lightbox} />
    </Section>
  )
}
