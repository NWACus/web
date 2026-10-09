'use client'

import type {
  BlockedRow,
  CourseImportPlan,
  RowSummary,
} from '@/services/courseImport/planCourseImport'
import type { ImportSummary } from '@/services/courseImport/runCourseImport'
import { Button, toast } from '@payloadcms/ui'
import type { ReactNode } from 'react'

// Tailwind's dark variant follows Payload's admin theme ([data-theme="dark"])
const TONES = {
  success: {
    header: 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200',
    border: 'border-green-300 dark:border-green-800',
  },
  error: {
    header: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
    border: 'border-red-300 dark:border-red-800',
  },
  warning: {
    header: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    border: 'border-amber-300 dark:border-amber-800',
  },
}

function RowLabel({ row, provider, title, start }: RowSummary) {
  return (
    <>
      <div className="font-medium">
        Row {row} · {title || 'No title'}
      </div>
      <div className="text-sm text-[var(--theme-elevation-600)]">
        {provider || 'No provider'} · {start || 'No start'}
      </div>
    </>
  )
}

/** One group of rows: a colored header, then a list that scrolls inside the box. */
function RowBox(props: {
  title: string
  count: number
  tone: keyof typeof TONES
  action?: ReactNode
  intro?: string
  children: ReactNode
}) {
  const tone = TONES[props.tone]
  return (
    <section
      aria-label={props.title}
      className={`flex min-h-0 flex-col overflow-hidden rounded border ${tone.border}`}
    >
      <header className={`flex items-center justify-between gap-2 px-4 py-3 ${tone.header}`}>
        <h2 className="m-0 text-base font-semibold">
          {props.title} · {props.count}
        </h2>
        {props.action}
      </header>
      {props.intro && (
        <p className="m-0 border-b border-[var(--theme-elevation-100)] px-4 py-2 text-sm">
          {props.intro}
        </p>
      )}
      <ul className="m-0 max-h-[calc(100vh-27rem)] min-h-24 list-none overflow-y-auto p-0">
        {props.count === 0 ? (
          <li className="px-4 py-3 text-[var(--theme-elevation-500)]">None.</li>
        ) : (
          props.children
        )}
      </ul>
    </section>
  )
}

function RowItem({ children }: { children: ReactNode }) {
  return (
    <li className="border-b border-[var(--theme-elevation-100)] px-4 py-2 last:border-b-0">
      {children}
    </li>
  )
}

function blockedRowsText(blocked: BlockedRow[]): string {
  return blocked
    .map((b) => {
      const reasons = b.reasons.map((r) => `  - ${r}`).join('\n')
      return `Row ${b.row} (${b.provider} · ${b.title} · ${b.start})\n${reasons}`
    })
    .join('\n\n')
}

function BlockedBox({ blocked, title }: { blocked: BlockedRow[]; title: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(blockedRowsText(blocked))
      toast.success('Blocked rows copied')
    } catch {
      toast.error("Couldn't copy to the clipboard")
    }
  }
  const action = blocked.length ? (
    <Button buttonStyle="secondary" size="small" margin={false} onClick={copy}>
      Copy
    </Button>
  ) : undefined
  return (
    <RowBox title={title} count={blocked.length} tone="error" action={action}>
      {blocked.map((row) => (
        <RowItem key={row.row}>
          <RowLabel {...row} />
          <ul className="mt-1 list-disc pl-5 text-sm text-red-800 dark:text-red-300">
            {row.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </RowItem>
      ))}
    </RowBox>
  )
}

const GRID = 'grid grid-cols-1 gap-4 lg:grid-cols-3'

export function FileErrors({ errors }: { errors: string[] }) {
  return (
    <div role="alert" className="mb-6 text-red-800 dark:text-red-300">
      <p className="font-medium">This file can&apos;t be imported:</p>
      <ul className="list-disc pl-6">
        {errors.map((fileError) => (
          <li key={fileError}>{fileError}</li>
        ))}
      </ul>
    </div>
  )
}

/** Before importing: what will be created, what can't be, and duplicates to opt into. */
export function PlanPreview(props: {
  plan: CourseImportPlan
  included: number[]
  onToggle: (row: number) => void
}) {
  const { plan } = props
  return (
    <div className={GRID}>
      <RowBox title="Ready to import" count={plan.ready.length} tone="success">
        {plan.ready.map((course) => (
          <RowItem key={course.row}>
            <RowLabel {...course} />
          </RowItem>
        ))}
      </RowBox>
      <BlockedBox title="Blocked" blocked={plan.blocked} />
      <RowBox
        title="Likely duplicates"
        count={plan.likelyDuplicates.length}
        tone="warning"
        intro="Match a Course already in the catalog, or an earlier row, on every field. Skipped unless ticked."
      >
        {plan.likelyDuplicates.map((duplicate) => (
          <RowItem key={duplicate.row}>
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={props.included.includes(duplicate.row)}
                onChange={() => props.onToggle(duplicate.row)}
                aria-label={`Import row ${duplicate.row} anyway`}
              />
              <span>
                <RowLabel {...duplicate} />
              </span>
            </label>
          </RowItem>
        ))}
      </RowBox>
    </div>
  )
}

/** After importing: every row and what happened to it. */
export function ImportSummaryBoxes({ summary }: { summary: ImportSummary }) {
  return (
    <div className={GRID}>
      <RowBox title="Imported" count={summary.created.length} tone="success">
        {summary.created.map((course) => (
          <RowItem key={course.row}>
            <div className="flex items-start gap-2">
              <span aria-hidden className="text-green-700 dark:text-green-300">
                ✓
              </span>
              <span>
                <RowLabel {...course} />
              </span>
            </div>
          </RowItem>
        ))}
      </RowBox>
      <BlockedBox title="Not imported" blocked={summary.blocked} />
      <RowBox title="Skipped duplicates" count={summary.skipped.length} tone="warning">
        {summary.skipped.map((course) => (
          <RowItem key={course.row}>
            <RowLabel {...course} />
          </RowItem>
        ))}
      </RowBox>
    </div>
  )
}
