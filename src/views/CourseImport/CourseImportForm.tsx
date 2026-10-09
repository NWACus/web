'use client'

import type { CourseImportPlan } from '@/services/courseImport/planCourseImport'
import type { ImportResult } from '@/services/courseImport/runCourseImport'
import { Button } from '@payloadcms/ui'
import { type ChangeEvent, useState, useTransition } from 'react'
import { previewCourseImport, runCourseImport } from './actions'
import { FileErrors, PlanPreview } from './PlanPreview'

type ImportSummary = Extract<ImportResult, { ok: true }>

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many)

function ImportSummaryMessage({ result }: { result: ImportSummary }) {
  return (
    <p role="status" className="mb-6">
      Imported {result.created} {plural(result.created, 'course', 'courses')}. Skipped{' '}
      {result.skipped} likely {plural(result.skipped, 'duplicate', 'duplicates')}. {result.blocked}{' '}
      blocked {plural(result.blocked, 'row was', 'rows were')} not imported.
    </p>
  )
}

function useCourseImport() {
  const [text, setText] = useState('')
  const [plan, setPlan] = useState<CourseImportPlan | null>(null)
  const [error, setError] = useState('')
  const [included, setIncluded] = useState<number[]>([])
  const [result, setResult] = useState<ImportSummary | null>(null)
  const [pending, startTransition] = useTransition()

  const preview = (contents: string) => {
    setText(contents)
    setPlan(null)
    setError('')
    setIncluded([])
    setResult(null)
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
      setResult(outcome)
      setPlan(null)
      setText('')
    })

  return { plan, error, included, result, pending, preview, toggle, confirm }
}

function FileField(props: {
  fileName: string
  disabled: boolean
  onText: (text: string, name: string) => void
}) {
  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) props.onText(await file.text(), file.name)
  }
  return (
    <label className="mb-6 block">
      <span className="mb-2 block font-medium">Course spreadsheet (CSV)</span>
      <input
        type="file"
        accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
        onChange={onChange}
        disabled={props.disabled}
      />
      {props.fileName && <span className="ml-2 text-muted-foreground">{props.fileName}</span>}
    </label>
  )
}

function ImportButton(props: { count: number; disabled: boolean; onClick: () => void }) {
  const label =
    props.count === 0
      ? 'Nothing to import'
      : `Import ${props.count} ${plural(props.count, 'course', 'courses')}`
  return (
    <Button onClick={props.onClick} disabled={props.disabled || props.count === 0}>
      {label}
    </Button>
  )
}

export function CourseImportForm() {
  const [fileName, setFileName] = useState('')
  const { plan, error, included, result, pending, preview, toggle, confirm } = useCourseImport()
  const fileErrors = plan?.fileErrors ?? []
  const readyPlan = plan && fileErrors.length === 0 ? plan : null

  const onText = (text: string, name: string) => {
    setFileName(name)
    preview(text)
  }

  return (
    <div className="max-w-4xl">
      <FileField fileName={fileName} disabled={pending} onText={onText} />
      {pending && <p className="mb-6">Working…</p>}
      {error && (
        <p role="alert" className="mb-6 text-red-700">
          {error}
        </p>
      )}
      {result && <ImportSummaryMessage result={result} />}
      {fileErrors.length > 0 && <FileErrors errors={fileErrors} />}
      {readyPlan && (
        <>
          <PlanPreview plan={readyPlan} included={included} onToggle={toggle} />
          <ImportButton
            count={readyPlan.ready.length + included.length}
            disabled={pending}
            onClick={confirm}
          />
        </>
      )}
    </div>
  )
}
