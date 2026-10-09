'use client'

import type { CourseImportPlan } from '@/services/courseImport/planCourseImport'
import { Button, toast } from '@payloadcms/ui'
import type { ReactNode } from 'react'

type Summary = { row: number; provider: string; title: string; start: string }

function RowLabel({ row, provider, title, start }: Summary) {
  const details = [provider || 'No provider', title || 'No title', start || 'No start']
  return (
    <>
      <span className="font-medium">Row {row}</span>
      <span className="text-muted-foreground"> · {details.join(' · ')}</span>
    </>
  )
}

const BORDERS = {
  ready: 'border-green-600',
  blocked: 'border-red-600',
  duplicate: 'border-amber-500',
}

function Section(props: {
  title: string
  count: number
  tone: keyof typeof BORDERS
  children: ReactNode
}) {
  return (
    <section className={`mb-8 border-l-4 pl-4 ${BORDERS[props.tone]}`}>
      <h2 className="mb-3 text-lg font-semibold">
        {props.title} · {props.count}
      </h2>
      {props.count === 0 ? <p className="text-muted-foreground">None.</p> : props.children}
    </section>
  )
}

function blockedRowsText(plan: CourseImportPlan): string {
  return plan.blocked
    .map((b) => {
      const reasons = b.reasons.map((r) => `  - ${r}`).join('\n')
      return `Row ${b.row} (${b.provider} · ${b.title} · ${b.start})\n${reasons}`
    })
    .join('\n\n')
}

function BlockedRows({ plan }: { plan: CourseImportPlan }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(blockedRowsText(plan))
      toast.success('Blocked rows copied')
    } catch {
      toast.error("Couldn't copy to the clipboard")
    }
  }
  return (
    <Section title="Blocked" count={plan.blocked.length} tone="blocked">
      <Button buttonStyle="secondary" size="small" onClick={copy}>
        Copy blocked rows
      </Button>
      <ul className="mt-3 space-y-3">
        {plan.blocked.map((blocked) => (
          <li key={blocked.row}>
            <RowLabel {...blocked} />
            <ul className="list-disc pl-6 text-red-700">
              {blocked.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function LikelyDuplicates(props: {
  plan: CourseImportPlan
  included: number[]
  onToggle: (row: number) => void
}) {
  return (
    <Section title="Likely duplicates" count={props.plan.likelyDuplicates.length} tone="duplicate">
      <p className="mb-3 text-muted-foreground">
        These match a Course already in the catalog, or an earlier row, on every field. They are
        skipped unless you tick them.
      </p>
      <ul className="space-y-1">
        {props.plan.likelyDuplicates.map((duplicate) => (
          <li key={duplicate.row}>
            <label className="flex items-baseline gap-2">
              <input
                type="checkbox"
                checked={props.included.includes(duplicate.row)}
                onChange={() => props.onToggle(duplicate.row)}
              />
              <span>
                <RowLabel {...duplicate} /> · import anyway
              </span>
            </label>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function FileErrors({ errors }: { errors: string[] }) {
  return (
    <div role="alert" className="mb-6 text-red-700">
      <p className="font-medium">This file can&apos;t be imported:</p>
      <ul className="list-disc pl-6">
        {errors.map((fileError) => (
          <li key={fileError}>{fileError}</li>
        ))}
      </ul>
    </div>
  )
}

export function PlanPreview(props: {
  plan: CourseImportPlan
  included: number[]
  onToggle: (row: number) => void
}) {
  return (
    <>
      <Section title="Ready" count={props.plan.ready.length} tone="ready">
        <ul className="space-y-1">
          {props.plan.ready.map((course) => (
            <li key={course.row}>
              <RowLabel {...course} />
            </li>
          ))}
        </ul>
      </Section>
      <BlockedRows plan={props.plan} />
      <LikelyDuplicates {...props} />
    </>
  )
}
