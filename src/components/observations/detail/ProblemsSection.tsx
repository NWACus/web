/**
 * An observation's avalanche problems, from the long form: each with its icon, a locator rose, and
 * the widget's distribution, sensitivity and size scales — or "Not Observed" / "Unknown" where the
 * observer left one out.
 */
import { AlertOctagon } from 'lucide-react'
import type { ReactNode } from 'react'

import { LocatorRoseGraphic } from '@/components/forecast/LocatorRoseGraphic'
import { ProblemScale } from '@/components/forecast/ProblemSlider'
import { AvalancheProblemLocation } from '@/services/nac/model/forecast'
import type { ObservedProblem } from '@/services/nac/model/observation'

import { NotObserved, Section, TextBlock } from './DetailParts'
import type { ObservationDetailData } from './detailTypes'

const DISTRIBUTIONS = ['isolated', 'specific', 'widespread']
const SENSITIVITIES = ['unreactive', 'stubborn', 'reactive', 'touchy']
const SIZES = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5']
const SIZE_LABELS = ['D1', null, 'D2', null, 'D3', null, 'D4', null, 'D5']

const capitalized = (values: string[]) => values.map((v) => v.charAt(0).toUpperCase() + v.slice(1))

/** The file for a problem's icon; the form's "Cornice" is the icon set's "CorniceFall". */
function problemIcon(type: string): string {
  // Spaces are dropped: "Wind Slab" → WindSlab.png.
  const file = type === 'Cornice' ? 'CorniceFall' : type.replace(/\s/g, '')
  return `/images/problem-icons/${file}.png`
}

const LOCATIONS = new Set<string>(Object.values(AvalancheProblemLocation))
function isLocation(value: string): value is AvalancheProblemLocation {
  return LOCATIONS.has(value)
}

function Unknown() {
  return <p className="text-sm">Unknown</p>
}

/** A value on one of the widget's problem scales, or its "Not Observed"/"Unknown" stand-ins. */
function Scale({ value, options }: { value: string | null; options: string[] }) {
  if (!value) return <NotObserved />
  if (value === 'unknown') return <Unknown />
  const step = options.indexOf(value)
  return <ProblemScale labels={capitalized(options)} range={step < 0 ? null : [step, step]} />
}

function sizeStep(size: string): number {
  return SIZES.indexOf(String(Number(size)))
}

function SizeScale({ size }: { size: [string, string] }) {
  if (size.includes('')) return <NotObserved />
  if (size.includes('unknown')) return <Unknown />
  const range: [number, number] = [sizeStep(size[0]), sizeStep(size[1])]
  return <ProblemScale labels={SIZE_LABELS} range={range.includes(-1) ? null : range} />
}

function Rose({ locations }: { locations: string[] }) {
  const sectors = locations.filter(isLocation)
  if (sectors.length === 0) return <NotObserved />
  return <LocatorRoseGraphic locations={sectors} />
}

function Measure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase text-muted-foreground">{title}</h4>
      {children}
    </div>
  )
}

function ProblemText({
  label,
  text,
  wide,
}: {
  label: string
  text: string | null
  wide?: boolean
}) {
  if (!text) return null
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <dt className="text-xs font-semibold uppercase text-muted-foreground">{label}</dt>
      <dd>
        <TextBlock text={text} />
      </dd>
    </div>
  )
}

function ProblemMeasures({ problem }: { problem: ObservedProblem }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-4">
      <Measure title="Location">
        <Rose locations={problem.locations} />
      </Measure>
      <Measure title="Distribution">
        <Scale value={problem.distribution} options={DISTRIBUTIONS} />
      </Measure>
      <Measure title="Sensitivity">
        <Scale value={problem.sensitivity} options={SENSITIVITIES} />
      </Measure>
      <Measure title="Size">
        <SizeScale size={problem.size} />
      </Measure>
    </div>
  )
}

function ProblemCard({ problem }: { problem: ObservedProblem }) {
  return (
    <article className="rounded-lg border">
      <header className="flex items-center gap-3 border-b px-3 py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={problemIcon(problem.type)} alt="" className="h-10 w-10 object-contain" />
        <h3 className="text-lg font-semibold">{problem.type}</h3>
      </header>
      <ProblemMeasures problem={problem} />
      <dl className="grid grid-cols-2 gap-3 px-3 pb-3 md:grid-cols-4">
        <ProblemText label="Layer" text={problem.layer} />
        <ProblemText label="Depth (cm)" text={problem.depth} />
        <ProblemText label="Comments" text={problem.comments} wide />
      </dl>
    </article>
  )
}

export function showsProblems({ observation }: ObservationDetailData): boolean {
  return observation.problems.length > 0 || Boolean(observation.problemsComments)
}

export function ProblemsSection({ detail }: { detail: ObservationDetailData }) {
  if (!showsProblems(detail)) return null
  const { problems, problemsComments } = detail.observation
  return (
    <Section icon={<AlertOctagon className="h-5 w-5" />} title="Problems">
      {problems.map((problem, index) => (
        <ProblemCard key={`${problem.type}-${index}`} problem={problem} />
      ))}
      {problemsComments && <TextBlock text={problemsComments} />}
    </Section>
  )
}
