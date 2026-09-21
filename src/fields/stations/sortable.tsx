'use client'

import { DragHandleIcon } from '@payloadcms/ui'

// Shared by the sortable tables of the stations and columns fields.

function moved<T>(list: T[], from: number, to: number): T[] {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// DraggableSortable's onDragEnd, reporting the reordered list.
export function reorder<T>(list: T[], onChange: (list: T[]) => void) {
  return ({ moveFromIndex, moveToIndex }: { moveFromIndex: number; moveToIndex: number }) =>
    onChange(moved(list, moveFromIndex, moveToIndex))
}

// The first two cells of a sortable row: the drag handle and the position.
export function HandleCells({ index, handle }: { index: number; handle: Record<string, unknown> }) {
  return (
    <>
      <td className="stations-table__handle" {...handle}>
        <DragHandleIcon />
      </td>
      <td className="stations-table__order">{index + 1}</td>
    </>
  )
}
