/**
 * The viewer's links are real links — to a tab, or to a record's own page — that a plain click
 * handles in place (switching the tab, opening the record over the list). Any modifier, or any
 * button but the main one, is left to the browser, so "open in a new tab" still does.
 */
import type { MouseEvent } from 'react'

const MODIFIERS = ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'] as const

export function isPlainClick(event: Pick<MouseEvent, 'button' | (typeof MODIFIERS)[number]>) {
  return event.button === 0 && !MODIFIERS.some((key) => event[key])
}
