'use client'

// The forecasts list: service date, issuance, status (draft / published /
// correction / withdrawn), author — plus creation of a new issuance draft and
// housekeeping (drafts delete outright and are visually distinct from
// corrections).
import { Button, toast } from '@payloadcms/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createForecastAction, removeForecastAction, type MwfListRow } from './actions'

function statusLabel(row: MwfListRow): string {
  if (row.status === 'draft')
    return row.isCorrection ? `correction draft r${row.revision}` : 'draft'
  if (row.status === 'published') {
    const scheduled = row.issuedAt != null && new Date(row.issuedAt).getTime() > Date.now()
    const base = scheduled ? 'scheduled' : 'published'
    return row.revision > 1 ? `${base} r${row.revision}` : base
  }
  return 'withdrawn'
}

export function MwfListClient({ initialRows }: { initialRows: MwfListRow[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [issuance, setIssuance] = useState<'morning' | 'afternoon'>('morning')
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [creating, setCreating] = useState(false)

  async function create() {
    setCreating(true)
    try {
      const result = await createForecastAction({ issuance, serviceDate })
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      router.push(`/admin/mwf?id=${result.id}`)
    } finally {
      setCreating(false)
    }
  }

  async function remove(row: MwfListRow) {
    const verb = row.status === 'draft' ? 'Delete' : 'Withdraw'
    if (!window.confirm(`${verb} the ${row.issuance} forecast for ${row.serviceDate}?`)) return
    const result = await removeForecastAction(row.id)
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    setRows((prev) =>
      row.status === 'draft'
        ? prev.filter((r) => r.id !== row.id)
        : prev.map((r) => (r.id === row.id ? { ...r, status: 'withdrawn' } : r)),
    )
    toast.success(`${verb} complete`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="mwf-create-row flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Service date
          <input
            type="date"
            className="mwf-input mwf-input--inline"
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Issuance
          <select
            className="mwf-input mwf-input--inline"
            value={issuance}
            onChange={(e) => setIssuance(e.target.value === 'afternoon' ? 'afternoon' : 'morning')}
          >
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
          </select>
        </label>
        <Button onClick={create} disabled={creating}>
          {creating ? 'Creating…' : 'New forecast'}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="mwf-table w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-2 py-1.5">Service date</th>
              <th className="px-2 py-1.5">Issuance</th>
              <th className="px-2 py-1.5">Status</th>
              <th className="px-2 py-1.5">Author</th>
              <th className="px-2 py-1.5">Issued</th>
              <th className="px-2 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-2 py-1.5">
                  <Link className="mwf-link" href={`/admin/mwf?id=${row.id}`}>
                    {row.serviceDate}
                  </Link>
                </td>
                <td className="px-2 py-1.5 capitalize">{row.issuance}</td>
                <td className="px-2 py-1.5">{statusLabel(row)}</td>
                <td className="px-2 py-1.5">{row.authorName ?? '—'}</td>
                <td className="px-2 py-1.5">
                  {row.issuedAt ? new Date(row.issuedAt).toLocaleString() : '—'}
                </td>
                <td className="px-2 py-1.5 text-right">
                  {row.status !== 'withdrawn' && (
                    <button type="button" className="mwf-mini-btn" onClick={() => remove(row)}>
                      {row.status === 'draft' ? 'Delete' : 'Withdraw'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="px-2 py-4 text-center" colSpan={6}>
                  No forecasts yet — create the first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
