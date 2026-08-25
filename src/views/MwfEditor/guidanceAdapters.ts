// Narrow the wire-shaped guidance artifacts into the typed shapes the shared
// overlay functions consume. Runtime-checked: a malformed artifact value just
// doesn't overlay.
import type { GuidanceArtifact } from '@/services/mwf/guidance'
import type {
  PrecipGuidanceArtifact,
  TempsGuidanceArtifact,
  WindsGuidanceArtifact,
} from '@/utilities/mwf/mwfData'

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null)

export function toPrecipOverlay(artifact: GuidanceArtifact | null): PrecipGuidanceArtifact | null {
  if (!artifact || !('periods' in artifact)) return null
  return { periods: artifact.periods.map((p) => ({ points: p.points })) }
}

export function toTempsOverlay(artifact: GuidanceArtifact | null): TempsGuidanceArtifact | null {
  if (!artifact || !('blocks' in artifact)) return null
  return {
    periods: artifact.blocks.map((block) => ({
      zones: Object.fromEntries(
        Object.entries(block.zones).map(([zone, models]) => [
          zone,
          Object.fromEntries(
            Object.entries(models).map(([title, vals]) => [
              title,
              { high: num(vals.high), low: num(vals.low) },
            ]),
          ),
        ]),
      ),
    })),
  }
}

export function toWindsOverlay(artifact: GuidanceArtifact | null): WindsGuidanceArtifact | null {
  if (!artifact || !('blocks' in artifact)) return null
  return {
    blocks: artifact.blocks.map((block) => ({
      zones: Object.fromEntries(
        Object.entries(block.zones).map(([zone, models]) => [
          zone,
          Object.fromEntries(
            Object.entries(models).map(([title, vals]) => [
              title,
              { speed: num(vals.speed), dir: str(vals.dir) },
            ]),
          ),
        ]),
      ),
    })),
  }
}
