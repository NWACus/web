/**
 * Shared assertions for the one invariant three forecast components depend on: a media caption is
 * sanitized on the server, and every client component that renders one writes only that form.
 *
 * Sits beside the suites rather than inside `client/`, so Jest's testMatch does not collect it.
 */
import { screen } from '@testing-library/react'

/** A caption as a forecaster could author it, carrying both an event handler and a script tag. */
export const HOSTILE_CAPTION =
  '<p>Photo: <img src="y" onerror="alert(1)"><script>alert(2)</script> Erik</p>'

/**
 * Every element rendering `HOSTILE_CAPTION` shows it sanitized.
 *
 * A caption can be on screen more than once — a problem figure's `figcaption` and the lightbox
 * footer render the same one — so this asserts over all of them rather than picking one. Pass
 * `atLeast` when the point of the test is that a caption reached more than a single renderer.
 */
export function expectCaptionsSanitized(atLeast = 1): void {
  const captions = screen.getAllByText(/Erik/)

  expect(captions.length).toBeGreaterThanOrEqual(atLeast)
  for (const caption of captions) {
    expect(caption.innerHTML).not.toContain('onerror')
    expect(caption.innerHTML).not.toContain('<script')
  }
  expect(document.querySelector('[onerror]')).toBeNull()
}
