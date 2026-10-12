'use client'

import {
  importBatches,
  importSummary,
  type ImportSummary,
  MAX_FILE_BYTES,
} from '@/services/courseImport/importBatches'
import type { CourseImportPlan, RowSummary } from '@/services/courseImport/planCourseImport'
import { Button } from '@payloadcms/ui'
import { type ChangeEvent, useState, useTransition } from 'react'
import { previewCourseImport, runCourseImport } from './actions'
import { FileErrors, ImportSummaryBoxes, PlanPreview } from './PlanPreview'

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many)

function SummaryLine({ summary }: { summary: ImportSummary }) {
  const created = summary.created.length
  return (
    <p role="status" className="m-0 font-medium text-green-700 dark:text-green-300">
      Imported {created} {plural(created, 'course', 'courses')}.
    </p>
  )
}

const TOO_LARGE = `That file is too large. A Course Import takes files up to ${MAX_FILE_BYTES / 1_000_000} MB.`

/** Sends the rows in batches so each call stays inside the server's time limit. */
async function importInBatches(
  text: string,
  plan: CourseImportPlan,
  included: number[],
  onProgress: (done: number, total: number) => void,
): Promise<{ created: RowSummary[]; error?: string }> {
  const batches = importBatches(plan, included)
  const total = batches.flat().length
  const created: RowSummary[] = []
  for (const rows of batches) {
    onProgress(created.length, total)
    const outcome = await runCourseImport(text, included, rows)
    if (!outcome.ok) return { created, error: outcome.error }
    created.push(...outcome.created)
  }
  return { created }
}

function partialImportError(error: string, created: number) {
  if (created === 0) return error
  return `${error} ${created} ${plural(created, 'course', 'courses')} from earlier batches were imported. Upload the sheet again to finish; those rows will show as likely duplicates.`
}

function useCourseImport() {
  const [text, setText] = useState('')
  const [plan, setPlan] = useState<CourseImportPlan | null>(null)
  const [error, setError] = useState('')
  const [included, setIncluded] = useState<number[]>([])
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [progress, setProgress] = useState('')
  const [pending, startTransition] = useTransition()

  const preview = (contents: string) => {
    setText(contents)
    setPlan(null)
    setError('')
    setIncluded([])
    setSummary(null)
    startTransition(async () => {
      const outcome = await previewCourseImport(contents)
      if (outcome.ok) setPlan(outcome.plan)
      else setError(outcome.error)
    })
  }

  const toggle = (row: number) =>
    setIncluded((rows) => (rows.includes(row) ? rows.filter((r) => r !== row) : [...rows, row]))

  const finish = (current: CourseImportPlan, created: RowSummary[], failure?: string) => {
    if (failure) setError(partialImportError(failure, created.length))
    if (created.length === 0) return
    setSummary(importSummary(current, created))
    setPlan(null)
    setText('')
  }

  const confirm = () =>
    startTransition(async () => {
      if (!plan) return
      const onProgress = (done: number, total: number) =>
        setProgress(`Imported ${done} of ${total}…`)
      const { created, error: failure } = await importInBatches(text, plan, included, onProgress)
      setProgress('')
      finish(plan, created, failure)
    })

  const reject = (message: string) => {
    setPlan(null)
    setSummary(null)
    setError(message)
  }

  return { plan, error, included, summary, progress, pending, preview, reject, toggle, confirm }
}

function FileField(props: {
  disabled: boolean
  onText: (text: string) => void
  onTooLarge: () => void
}) {
  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_BYTES) props.onTooLarge()
    else props.onText(await file.text())
  }
  return (
    <label className="block">
      <span className="mb-1 block font-medium">Course spreadsheet (CSV)</span>
      <input
        type="file"
        accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
        onChange={onChange}
        disabled={props.disabled}
      />
    </label>
  )
}

function ImportButton(props: { count: number; disabled: boolean; onClick: () => void }) {
  const label =
    props.count === 0
      ? 'Nothing to import'
      : `Import ${props.count} ${plural(props.count, 'course', 'courses')}`
  return (
    <Button margin={false} onClick={props.onClick} disabled={props.disabled || props.count === 0}>
      {label}
    </Button>
  )
}

// Covered end to end by the course-import e2e spec, which fallow's coverage estimate can't see.
// fallow-ignore-next-line complexity
export function CourseImportForm() {
  const { plan, error, included, summary, progress, pending, preview, reject, toggle, confirm } =
    useCourseImport()
  const fileErrors = plan?.fileErrors ?? []
  const readyPlan = plan && fileErrors.length === 0 ? plan : null

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <FileField disabled={pending} onText={preview} onTooLarge={() => reject(TOO_LARGE)} />
        {pending && <p className="m-0">{progress || 'Working…'}</p>}
        {summary && <SummaryLine summary={summary} />}
        {readyPlan && (
          <ImportButton
            count={readyPlan.ready.length + included.length}
            disabled={pending}
            onClick={confirm}
          />
        )}
      </div>
      {error && (
        <p role="alert" className="mb-4 text-red-800 dark:text-red-300">
          {error}
        </p>
      )}
      {fileErrors.length > 0 && <FileErrors errors={fileErrors} />}
      {readyPlan && <PlanPreview plan={readyPlan} included={included} onToggle={toggle} />}
      {summary && <ImportSummaryBoxes summary={summary} />}
    </div>
  )
}
