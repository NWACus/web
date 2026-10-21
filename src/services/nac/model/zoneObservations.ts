/**
 * The zone's recent observations and avalanches, as the forecast page's Observations and
 * Avalanches tabs show them (Forecast-9). The fields are the ones the widget's cards read.
 */

/**
 * What a card's thumbnail shows: the first image, else the first item as a tile. `unknown` is a
 * kind the widget's `Thumbnail` doesn't draw, which leaves only the media count.
 */
export type MediaThumbnail =
  | { kind: 'image'; src: string }
  | { kind: 'video'; src: string | null }
  | { kind: 'pdf' }
  | { kind: 'external' }
  | { kind: 'unknown' }

export interface ZoneObservation {
  id: string
  /** `YYYY-MM-DD`. */
  date: string
  location: string | null
  observerType: string | null
  organization: string | null
  avalanchesObserved: boolean
  /** Cracking or collapsing, which the widget reports as one sign. */
  instability: boolean
  thumbnail: MediaThumbnail | null
  /** The observation's media plus its avalanches', when it has media of its own (the widget's rule). */
  mediaCount: number
}

export interface ZoneAvalanche {
  id: string
  /** `YYYY-MM-DD`. */
  date: string
  location: string | null
  number: number | null
  aspect: string | null
  elevation: number | null
  dSize: string | null
  trigger: string | null
  thumbnail: MediaThumbnail | null
  mediaCount: number
}

export interface ZoneObservations {
  /** The 7 days shown, `YYYY-MM-DD`, in the center's timezone. */
  window: { from: string; to: string }
  observations: ZoneObservation[]
  avalanches: ZoneAvalanche[]
}
