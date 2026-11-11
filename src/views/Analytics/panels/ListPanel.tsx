'use client'

import {
  LIST_ROW_SCHEMAS,
  type ListPanel as ListPanelKey,
  type ListRowMap,
} from '@/services/posthog/panelTypes'
import { cn } from '@/utilities/ui'
import { useState, type ReactNode } from 'react'
import { formatCompact } from '../format'
import { listCsv, type ListColumn, type ListSpec } from '../lists'
import { parseRows, usePanel, type PanelRequest } from '../usePanel'
import { BarList, type BarListRow } from './BarList'
import { csvExportItems, ExportMenu } from './ExportMenu'
import { MUTED, PanelBody, PanelFrame } from './Panel'

type TabOption = { key: string; label: string }

type TabBodyProps = {
  request: PanelRequest
  totalVisitors?: number
  tabs: TabOption[]
  onTab: (key: string) => void
}

/** A list spec bound to its row type, ready to sit in a tabbed card beside other lists. */
export type ListTab = TabOption & { Body: (props: TabBodyProps) => ReactNode }

function cell<Row>(column: ListColumn<Row>, row: Row): string {
  const value = column.value(row)
  return value === null ? '–' : (column.format ?? formatCompact)(value)
}

function barRows<K extends ListPanelKey>(spec: ListSpec<K>, rows: ListRowMap[K][]): BarListRow[] {
  const [bar, ...extra] = spec.columns
  return rows.map((row) => {
    const name = spec.name.text(row)
    const detail = spec.detail?.text(row)
    return {
      key: spec.key(row),
      title: detail ? `${name} (${detail})` : name,
      label: (
        <>
          {name}
          {detail && <span className={cn('block truncate text-xs', MUTED)}>{detail}</span>}
        </>
      ),
      value: bar.value(row) ?? 0,
      extra: extra.map((column) => cell(column, row)),
    }
  })
}

function ShowAllToggle({
  total,
  open,
  onToggle,
}: {
  total: number
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn('mt-3 self-start text-xs underline', MUTED)}
    >
      {open ? 'Show fewer' : `Show all ${total}`}
    </button>
  )
}

/** The card's rows: a bar list, cut to the spec's limit behind a "Show all" toggle. */
function ListRows<K extends ListPanelKey>({
  spec,
  rows,
  share,
}: {
  spec: ListSpec<K>
  rows: ListRowMap[K][]
  /** The total each row's share is taken of, when the list shows one. */
  share?: number
}) {
  const [showAll, setShowAll] = useState(false)
  const [bar, ...extra] = spec.columns
  const limit = Math.min(spec.limit ?? Infinity, rows.length)
  const headers = {
    label: spec.name.header,
    value: bar.header,
    extra: extra.map((column) => column.header),
  }
  return (
    <>
      <BarList
        total={share}
        headers={headers}
        rows={barRows(spec, showAll ? rows : rows.slice(0, limit))}
      />
      {limit < rows.length && (
        <ShowAllToggle
          total={rows.length}
          open={showAll}
          onToggle={() => setShowAll((open) => !open)}
        />
      )}
    </>
  )
}

/** Binds a spec to its panel's row schema; call once at module level so the parser is stable. */
export function listTab<K extends ListPanelKey>(spec: ListSpec<K>): ListTab {
  const parse = parseRows(LIST_ROW_SCHEMAS[spec.panel])
  function Body({ request, totalVisitors, tabs, onTab }: TabBodyProps) {
    const state = usePanel(spec.panel, request, parse)
    const exportItems = csvExportItems(state, request.center, spec.label, (data) =>
      listCsv(spec, data.rows),
    )
    return (
      <PanelFrame
        tabs={tabs}
        active={spec.panel}
        onTab={onTab}
        actions={<ExportMenu name={spec.label} items={exportItems} />}
      >
        {spec.note && <p className={cn('mb-3 mt-0 text-xs', MUTED)}>{spec.note}</p>}
        <PanelBody state={state} empty={spec.empty}>
          {({ rows }) =>
            rows.length === 0 ? null : (
              <ListRows spec={spec} rows={rows} share={spec.share ? totalVisitors : undefined} />
            )
          }
        </PanelBody>
      </PanelFrame>
    )
  }

  return { key: spec.panel, label: spec.label, Body }
}

/** A card of one or more lists as tabs; each tab fetches on first view. */
export function ListPanel({
  tabs,
  request,
  totalVisitors,
}: {
  tabs: [ListTab, ...ListTab[]]
  request: PanelRequest
  /** The period's unique visitors, for the share column. */
  totalVisitors?: number
}) {
  const [activeKey, setActiveKey] = useState(tabs[0].key)
  const tab = tabs.find((candidate) => candidate.key === activeKey) ?? tabs[0]
  return (
    <tab.Body request={request} totalVisitors={totalVisitors} tabs={tabs} onTab={setActiveKey} />
  )
}
