import type { AvalancheCenterWidgetConfiguration } from '@/services/nac/types/schemas'

// The AFP zoom is tuned for the full-height /observations map; the block's map is shorter
const BLOCK_ZOOM_OUT = 0.5

// Follows the widget's own fallback: the observation viewer's zoom, else the danger map's less one
export function observationsBlockMapZoom(
  widgetConfig: AvalancheCenterWidgetConfiguration | undefined,
): number | undefined {
  const { observation_viewer, danger_map } = widgetConfig ?? {}
  const afpZoom =
    observation_viewer?.map_zoom ??
    (danger_map?.zoom !== undefined ? danger_map.zoom - 1 : undefined)

  return afpZoom === undefined ? undefined : afpZoom - BLOCK_ZOOM_OUT
}
