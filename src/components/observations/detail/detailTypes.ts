/**
 * What an observation or avalanche detail renders from: the model, with its HTML already
 * sanitized and its media already arranged into galleries and one lightbox sequence.
 *
 * Built on the server by `./prepareDetail` — for the full page directly, and for the modal over
 * the list through `/api/[center]/observations/[kind]/[id]` — because sanitizing is a server job
 * (see "Sanitizing forecaster HTML" in docs/afp-products/architecture.md). The detail components
 * render only from this, so the same markup serves both.
 */
import type { LightboxMedia } from '@/components/forecast/lightboxMedia'
import type {
  Avalanche,
  MediaItem,
  Observation,
  ObservationKind,
} from '@/services/nac/model/observation'
import type { AvalancheCardData } from '@/services/nac/observations/cards'

/** One tile of a media gallery: a photo or video opens the lightbox, anything else a new tab. */
export type GalleryTile =
  | { kind: 'media'; item: MediaItem; lightboxIndex: number | null }
  | { kind: 'link'; href: string; title: string }

export interface ObservationDetailData {
  kind: 'observation'
  /** The record, without its raw HTML fields — only the sanitized copies below are rendered. */
  observation: Omit<Observation, 'summary' | 'snowpackSummary' | 'avalanches'>
  summaryHtml: string | null
  snowpackHtml: string | null
  gallery: GalleryTile[]
  snowpackGallery: GalleryTile[]
  /** Newest first, as the widget lists them. */
  avalanches: AvalancheCardData[]
  /**
   * Every photo and video on the page in one sequence — the observation's, then each avalanche's,
   * then the snowpack's — so the lightbox pages through all of them as the widget's does.
   */
  lightbox: LightboxMedia[]
}

export interface AvalancheDetailData {
  kind: 'avalanche'
  avalanche: Avalanche
  gallery: GalleryTile[]
  lightbox: LightboxMedia[]
}

export type DetailData = ObservationDetailData | AvalancheDetailData

/** A record's title, over it on its own page and in the modal's header. */
export const RECORD_TITLES: Record<ObservationKind, string> = {
  observation: 'Field Observation',
  avalanche: 'Avalanche Occurrence',
}
