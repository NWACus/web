import { expect, type Page } from '@playwright/test'

// Minimal valid Lexical state for a required richText field
export const MINIMAL_LEXICAL = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'E2E test content',
            version: 1,
          },
        ],
      },
    ],
  },
}

/**
 * Creates a draft doc (nwac tenant) and returns its id. The fetch runs inside the
 * page so it carries the session + tenant cookies, which Playwright's request
 * context does not; the page must already be on the localhost origin. `?draft=true`
 * skips required-field validation. Override defaults (e.g. `tenant`) via `data`.
 */
export async function createDraftDoc(
  page: Page,
  collection: string,
  data: Record<string, unknown> = {},
): Promise<number> {
  const result = await page.evaluate(
    async ({ collection, data }) => {
      const res = await fetch(`/api/${collection}?draft=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: 2, // nwac
          _status: 'draft',
          slug: `e2e-${Date.now()}`,
          title: 'E2E test doc',
          ...data,
        }),
      })
      return { ok: res.ok, status: res.status, body: await res.json() }
    },
    { collection, data },
  )

  expect(
    result.ok,
    `create ${collection} failed (${result.status}): ${JSON.stringify(result.body)}`,
  ).toBeTruthy()
  return result.body.doc.id
}

/** Deletes a doc via a fetch run inside the page. */
export async function deleteDoc(page: Page, collection: string, id: number): Promise<void> {
  await page.evaluate(
    ({ collection, id }) => fetch(`/api/${collection}/${id}`, { method: 'DELETE' }),
    { collection, id },
  )
}
