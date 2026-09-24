/**
 * Likelihood and size scales for an avalanche problem — a port of the legacy afp widget's
 * ProblemSlider.vue at its dimensions: a 200px vertical rail (175px on phones) with a tick at each
 * labeled step, the forecast value or range boxed, and its labels bolded.
 *
 * Steps are indexed from the bottom, as in the widget. Size runs in half steps (a "D1.5" range
 * ends between two ticks), so its scale has seven steps with only the whole sizes labeled.
 */
import { AvalancheProblemLikelihood, AvalancheProblemSize } from '@/services/nac/model/forecast'
import { cn } from '@/utilities/ui'

interface ProblemSliderCoreProps {
  /** Bottom to top; a null step has no tick or label. */
  labels: (string | null)[]
  /** [from, to] step indices of the forecast value, or null when there is none to mark. */
  range: [number, number] | null
}

function ProblemSliderCore({ labels, range }: ProblemSliderCoreProps) {
  const percent = (index: number) => (index / (labels.length - 1)) * 100

  return (
    <div className="relative mx-auto mb-10 h-[175px] w-32 p-2 sm:h-[200px]">
      <div className="relative left-[15px] top-0 h-full w-[3px] bg-[#515558]">
        {labels.map((label, index) =>
          label ? (
            <div
              key={`step-${index}`}
              className="absolute -left-[11px] h-1 w-6 bg-[#515558]"
              style={{ bottom: `${percent(index)}%` }}
            />
          ) : null,
        )}
        {range && (
          <div
            className="absolute -left-[11px] w-6 -translate-y-px border-2 border-[#515558] bg-[#c8cace]"
            style={{
              bottom: `calc(${percent(range[0])}% - 4px)`,
              top: `calc(${100 - percent(range[1])}% - 4px)`,
            }}
          />
        )}
        {labels.map((label, index) => {
          if (!label) return null
          const active = range != null && index >= range[0] && index <= range[1]
          return (
            <div
              key={`label-${index}`}
              className={cn(
                'absolute left-5 w-32 translate-y-1.5 text-left text-sm leading-none',
                active ? 'font-bold text-foreground' : 'text-[#a8aaac]',
              )}
              style={{ bottom: `${percent(index)}%` }}
            >
              {label}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Likelihood ────────────────────────────────────────────────────────────

const LIKELIHOOD_LABELS = ['Unlikely', 'Possible', 'Likely', 'Very Likely', 'Certain']

/** "Almost certain" is an older spelling of the top step; the widget's lookup missed it entirely. */
const likelihoodStep: Record<AvalancheProblemLikelihood, number> = {
  [AvalancheProblemLikelihood.Unlikely]: 0,
  [AvalancheProblemLikelihood.Possible]: 1,
  [AvalancheProblemLikelihood.Likely]: 2,
  [AvalancheProblemLikelihood.VeryLikely]: 3,
  [AvalancheProblemLikelihood.AlmostCertain]: 4,
  [AvalancheProblemLikelihood.Certain]: 4,
}

export function LikelihoodSlider({ likelihood }: { likelihood: AvalancheProblemLikelihood }) {
  const step = likelihoodStep[likelihood]
  return (
    <ProblemSliderCore
      labels={LIKELIHOOD_LABELS}
      range={step === undefined ? null : [step, step]}
    />
  )
}

// ─── Size ──────────────────────────────────────────────────────────────────

const SIZE_NAMES: [AvalancheProblemSize, string][] = [
  [AvalancheProblemSize.Small, 'Small (D1)'],
  [AvalancheProblemSize.Large, 'Large (D2)'],
  [AvalancheProblemSize.VeryLarge, 'Very Large (D3)'],
  [AvalancheProblemSize.Historic, 'Historic (D4-5)'],
]

/** A size's step on the half-step scale, where Small is step 0. */
function stepOf(size: number): number {
  return (size - AvalancheProblemSize.Small) * 2
}

/** Seven steps from Small to Historic; the half steps between the named sizes go unlabeled. */
const SIZE_LABELS = Array.from(
  { length: stepOf(AvalancheProblemSize.Historic) + 1 },
  (_, step) => SIZE_NAMES.find(([size]) => stepOf(size) === step)?.[1] ?? null,
)

/** Size 1–4 in half steps onto the seven-step scale, clamped to its ends. */
function sizeStep(size: number): number {
  return Math.min(SIZE_LABELS.length - 1, Math.max(0, Math.round(stepOf(size))))
}

export function SizeSlider({ size }: { size: number[] }) {
  if (size.length === 0) return <ProblemSliderCore labels={SIZE_LABELS} range={null} />

  const from = sizeStep(Math.min(...size))
  const to = sizeStep(Math.max(...size))
  return <ProblemSliderCore labels={SIZE_LABELS} range={[from, to]} />
}
