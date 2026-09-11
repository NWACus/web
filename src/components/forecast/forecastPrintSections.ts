/**
 * The printable sections of a forecast product, and the filename the browser offers when the
 * reader saves the print as a PDF.
 *
 * Print works by `@media print` over the live page rather than a second rendering path: the
 * reader's selection is written to `document.documentElement`'s `data-print-sections` attribute
 * and the print stylesheet in `print.css` hides the sections that aren't listed. Keeping the keys
 * here means the component markup, the client toggle and the stylesheet all agree on one
 * vocabulary.
 */
import { ProductType, type ForecastResult, type Weather } from '@/services/nac/model/forecast'

export const PRINT_SECTIONS = ['bottomLine', 'problems', 'discussion', 'weather'] as const

export type PrintSection = (typeof PRINT_SECTIONS)[number]

/**
 * Checkbox labels, matching the legacy afp print modal word-for-word. "Bottom Line & Danger"
 * covers both because the widget gated them on a single checkbox.
 */
export const PRINT_SECTION_LABELS: Record<PrintSection, string> = {
  bottomLine: 'Bottom Line & Danger (Recommended)',
  problems: 'Avalanche Problems',
  discussion: 'Forecast Discussion',
  weather: 'Mountain Weather',
}

/**
 * Which sections start checked. Carried over from the legacy widget, where these were hardcoded
 * per-mount defaults (no persistence — the modal reset every time it opened). Discussion is the
 * only one off by default; the widget left no recorded reason, but it's the longest section and
 * html2pdf grew slow and heavy with it included.
 */
export const DEFAULT_PRINT_SECTIONS: readonly PrintSection[] = ['bottomLine', 'problems', 'weather']

/**
 * Only offer a section the product actually has content for. The legacy modal rendered the
 * Mountain Weather checkbox unconditionally even though the section was gated on the weather
 * product existing, so centers that publish no weather product got a checkbox that did nothing.
 */
export function availablePrintSections(
  forecastResult: ForecastResult,
  weather: Weather | null | undefined,
): PrintSection[] {
  const isForecast = forecastResult.product_type === ProductType.Forecast

  const sections: PrintSection[] = []

  // Danger ratings only exist on a full forecast, so a summary offers this only for its bottom line.
  if (forecastResult.bottom_line || isForecast) sections.push('bottomLine')
  if (isForecast && forecastResult.forecast_avalanche_problems.length > 0) sections.push('problems')
  if (forecastResult.hazard_discussion) sections.push('discussion')
  if (weather) sections.push('weather')

  return sections
}

/** Lowercase, strip anything that isn't alphanumeric, and collapse runs into single hyphens. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * The filename offered in the browser's save dialog, e.g.
 * `nwac-olympics-avalanche-forecast-2026-04-20`. Set as `document.title` immediately before
 * `window.print()`, which is where Chrome, Edge and desktop Safari read the default from; iOS
 * routes print through the share sheet and names the file itself. The OS handles de-duplication,
 * so repeated saves land as `… (1)`, `… (2)` exactly as they did with the legacy widget.
 *
 * No extension — the browser appends `.pdf`.
 */
export function forecastPrintFilename({
  centerSlug,
  zoneName,
  productType,
  validDate,
}: {
  centerSlug: string
  zoneName: string
  productType: ProductType
  validDate: string
}): string {
  const product =
    productType === ProductType.Forecast ? 'avalanche-forecast' : 'avalanche-information'

  return [slugify(centerSlug), slugify(zoneName), product, validDate].filter(Boolean).join('-')
}
