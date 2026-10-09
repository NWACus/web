'use client'

import type { CourseImportPlan } from '@/services/courseImport/planCourseImport'
import type { ImportSummary } from '@/services/courseImport/runCourseImport'
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

function useCourseImport() {
  const [text, setText] = useState('')
  const [plan, setPlan] = useState<CourseImportPlan | null>(null)
  const [error, setError] = useState('')
  const [included, setIncluded] = useState<number[]>([])
  const [summary, setSummary] = useState<ImportSummary | null>(null)
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

  const confirm = () =>
    startTransition(async () => {
      const outcome = await runCourseImport(text, included)
      if (!outcome.ok) return setError(outcome.error)
      setSummary(outcome)
      setPlan(null)
      setText('')
    })

  return { plan, error, included, summary, pending, preview, toggle, confirm }
}

function FileField(props: { disabled: boolean; onText: (text: string) => void }) {
  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) props.onText(await file.text())
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

export function CourseImportForm() {
  const { plan, error, included, summary, pending, preview, toggle, confirm } = useCourseImport()
  const fileErrors = plan?.fileErrors ?? []
  const readyPlan = plan && fileErrors.length === 0 ? plan : null

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <FileField disabled={pending} onText={preview} />
        {pending && <p className="m-0">Working…</p>}
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
