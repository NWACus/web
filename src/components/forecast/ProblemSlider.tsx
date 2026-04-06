/**
 * ProblemSlider — vertical severity number line with highlighted range.
 * Pixel-perfect port from avy/components/SeverityNumberLine.tsx.
 *
 * Two variants:
 * - Likelihood: 5 labels, single value highlighted (from === to)
 * - Size: 4 labels, min/max range highlighted
 */
import {
  AvalancheProblemLikelihood,
  AvalancheProblemSize,
} from '@/services/nac/types/forecastSchemas'

// ─── Shared slider core ────────────────────────────────────────────────────

interface ProblemSliderCoreProps {
  labels: string[]
  /** [from, to] indices into the labels array, 0 = topmost label */
  range: [number, number]
  className?: string
}

const PADDING = 5
const STROKE_WIDTH = 2
const AXIS_HEIGHT = 200
const RANGE_PADDING = 4
const LINE_COLOR = 'rgb(81,85,88)'
const RANGE_FILL = 'rgb(200,202,206)'
const ACTIVE_COLOR = 'rgb(30,35,38)'
const INACTIVE_COLOR = 'rgb(168,170,172)'

function yPos(index: number, labelCount: number): number {
  return PADDING + STROKE_WIDTH / 2 + AXIS_HEIGHT * (index / (labelCount - 1))
}

function ProblemSliderCore({ labels, range, className }: ProblemSliderCoreProps) {
  const [from, to] = range
  const svgHeight = 2 * PADDING + STROKE_WIDTH + AXIS_HEIGHT
  const rangeTop = yPos(from, labels.length) + RANGE_PADDING
  const rangeHeight = yPos(to, labels.length) - yPos(from, labels.length) - RANGE_PADDING * 2

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'row', aspectRatio: '4/5' }}
    >
      <div style={{ height: '80%', display: 'flex', alignItems: 'center' }}>
        <svg
          viewBox={`0 0 25 ${svgHeight}`}
          fillRule="evenodd"
          clipRule="evenodd"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeMiterlimit={1.5}
          style={{ height: '100%', aspectRatio: `${25}/${AXIS_HEIGHT}`, marginRight: 4 }}
        >
          {/* Axis line */}
          <path stroke={LINE_COLOR} strokeWidth={STROKE_WIDTH} d="M12.5,6l0,200Z" />
          {/* Highlighted range rectangle */}
          <path
            stroke={LINE_COLOR}
            strokeWidth={STROKE_WIDTH}
            fill={RANGE_FILL}
            d={`M0,${rangeTop}l25,0l0,${rangeHeight}l-25,0l0,${-rangeHeight}Z`}
          />
        </svg>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '83%',
        }}
      >
        {labels.map((label, index) => {
          const isActive = from <= index && index <= to
          return (
            <span
              key={label}
              style={{
                fontWeight: isActive ? 'bold' : 'normal',
                color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                fontSize: '0.75rem',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── Likelihood variant ────────────────────────────────────────────────────

interface LikelihoodSliderProps {
  likelihood: AvalancheProblemLikelihood
  className?: string
}

function likelihoodText(input: string): string {
  return input
    .toLowerCase()
    .split(' ')
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join(' ')
}

// Maps likelihood enum → label index (0 = topmost = most severe)
// "Certain" and "Almost Certain" both map to index 0 (top label is "Certain")
const likelihoodIndex: Record<AvalancheProblemLikelihood, number> = {
  [AvalancheProblemLikelihood.Certain]: 0,
  [AvalancheProblemLikelihood.AlmostCertain]: 0,
  [AvalancheProblemLikelihood.VeryLikely]: 1,
  [AvalancheProblemLikelihood.Likely]: 2,
  [AvalancheProblemLikelihood.Possible]: 3,
  [AvalancheProblemLikelihood.Unlikely]: 4,
}

const LIKELIHOOD_LABELS = [
  likelihoodText(AvalancheProblemLikelihood.Certain),
  likelihoodText(AvalancheProblemLikelihood.VeryLikely),
  likelihoodText(AvalancheProblemLikelihood.Likely),
  likelihoodText(AvalancheProblemLikelihood.Possible),
  likelihoodText(AvalancheProblemLikelihood.Unlikely),
]

export function LikelihoodSlider({ likelihood, className }: LikelihoodSliderProps) {
  const idx = likelihoodIndex[likelihood] ?? 4
  return <ProblemSliderCore labels={LIKELIHOOD_LABELS} range={[idx, idx]} className={className} />
}

// ─── Size variant ──────────────────────────────────────────────────────────

interface SizeSliderProps {
  size: number[]
  className?: string
}

function sizeText(input: AvalancheProblemSize): string {
  switch (input) {
    case AvalancheProblemSize.Historic:
      return 'Historic (D4-5)'
    case AvalancheProblemSize.VeryLarge:
      return 'Very Large (D3)'
    case AvalancheProblemSize.Large:
      return 'Large (D2)'
    case AvalancheProblemSize.Small:
      return 'Small (D1)'
  }
}

const SIZE_LABELS = [
  sizeText(AvalancheProblemSize.Historic),
  sizeText(AvalancheProblemSize.VeryLarge),
  sizeText(AvalancheProblemSize.Large),
  sizeText(AvalancheProblemSize.Small),
]

export function SizeSlider({ size, className }: SizeSliderProps) {
  // SeverityNumberLine assumes 0 = topmost label (Historic).
  // size[] values use AvalancheProblemSize enum (1=Small .. 4=Historic).
  // Map: index = Historic(4) - sizeValue. Clamp to valid range [0, 3].
  const from = Math.min(AvalancheProblemSize.Historic - 1, AvalancheProblemSize.Historic - size[0])
  const to = Math.max(0, AvalancheProblemSize.Historic - size[1])
  return <ProblemSliderCore labels={SIZE_LABELS} range={[from, to]} className={className} />
}
