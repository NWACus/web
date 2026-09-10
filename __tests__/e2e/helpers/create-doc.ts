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

/** A minimal valid `content` layout block, for docs that must pass publish validation. */
export const MINIMAL_CONTENT_BLOCK = {
  blockType: 'content',
  backgroundColor: 'transparent',
  layout: '1_1',
  columns: [{ richText: MINIMAL_LEXICAL }],
}

/**
 * Runs a fetch from inside the page so it carries the session + tenant cookies and an
 * Origin header. Payload ignores cookie auth on requests without an Origin, so
 * Playwright's Node-side `request` fixture would run unauthenticated. The page must
 * already be on the target origin; relative paths resolve against it. The body is
 * parsed as JSON when possible and returned as text otherwise.
 */
export async function apiRequest(
  page: Page,
  path: string,
  init: { method?: string; body?: unknown } = {},
) {
  return page.evaluate(
    async ({ path, init }) => {
      const res = await fetch(path, {
        method: init.method ?? 'GET',
        headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      })
      const text = await res.text()
      const parseBody = () => {
        try {
          return JSON.parse(text)
        } catch {
          return text
        }
      }
      return { ok: res.ok, status: res.status, body: parseBody() }
    },
    { path, init },
  )
}

async function createDoc(
  page: Page,
  collection: string,
  data: Record<string, unknown>,
  { draft }: { draft: boolean },
): Promise<number> {
  const result = await apiRequest(
    page,
    draft ? `/api/${collection}?draft=true` : `/api/${collection}`,
    {
      method: 'POST',
      body: {
        tenant: 2, // nwac
        _status: draft ? 'draft' : 'published',
        // Random suffix so parallel tests never collide on the per-tenant unique slug
        slug: `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: 'E2E test doc',
        ...data,
      },
    },
  )

  expect(
    result.ok,
    `create ${collection} failed (${result.status}): ${JSON.stringify(result.body)}`,
  ).toBeTruthy()
  return result.body.doc.id
}

/**
 * Creates a draft doc (nwac tenant) and returns its id. `?draft=true` skips
 * required-field validation. Override defaults (e.g. `tenant`) via `data`.
 */
export async function createDraftDoc(
  page: Page,
  collection: string,
  data: Record<string, unknown> = {},
): Promise<number> {
  return createDoc(page, collection, data, { draft: true })
}

/**
 * Creates a published doc (nwac tenant) and returns its id. Unlike drafts this runs
 * full validation, so required fields (e.g. `layout` for pages) must be in `data`.
 */
export async function createPublishedDoc(
  page: Page,
  collection: string,
  data: Record<string, unknown> = {},
): Promise<number> {
  return createDoc(page, collection, data, { draft: false })
}

/** Deletes a doc via a fetch run inside the page. */
export async function deleteDoc(page: Page, collection: string, id: number): Promise<void> {
  await apiRequest(page, `/api/${collection}/${id}`, { method: 'DELETE' })
}
