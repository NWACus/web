import { addDataAndFileToRequest } from 'payload'

/**
 * Regression test for patches/payload.patch.
 *
 * Payload 3.81.0 only parses a multipart body when `Content-Length` is present.
 * Vercel intermittently forwards admin saves with `Transfer-Encoding: chunked`
 * and no `Content-Length`, so the body is dropped, `req.data` stays undefined,
 * and the update operation throws
 * `Cannot read properties of undefined (reading '_status')`.
 *
 * Upstream fix: payloadcms/payload#16301, released in 3.84.0. We carry it as a
 * patch until we upgrade. These tests fail if the patch stops applying — at
 * which point, if we are on >= 3.84.0, delete the patch and this file.
 *
 * @see https://github.com/payloadcms/payload/issues/16351
 */

const BOUNDARY = '----AvyWebTestBoundary'

function mockPayload() {
  return {
    config: {},
    collections: {},
    logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
  }
}

/**
 * `addDataAndFileToRequest` reads only headers, method, body and
 * `payload.{config,collections,logger}`. A faithful `PayloadRequest` would
 * need a live Payload instance, so the mock covers just that surface.
 */
type MockPayloadRequest = Request & {
  payload: ReturnType<typeof mockPayload>
  data?: Record<string, unknown>
}

function buildMultipartBody(fields: Record<string, string>): string {
  const parts = Object.entries(fields).map(
    ([name, value]) =>
      `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
  )
  return `${parts.join('')}--${BOUNDARY}--\r\n`
}

function buildRequest(body: string, headers: Record<string, string>): MockPayloadRequest {
  const request = new Request('http://localhost:3000/api/pages/43?draft=true', {
    method: 'PATCH',
    headers: { 'Content-Type': `multipart/form-data; boundary=${BOUNDARY}`, ...headers },
    body,
  })

  return Object.assign(request, { payload: mockPayload() })
}

/**
 * The wire shape Vercel intermittently produces for admin saves. Setting
 * `Transfer-Encoding` explicitly keeps Node from adding `Content-Length`.
 */
function chunkedRequest(body: string): MockPayloadRequest {
  return buildRequest(body, { 'Transfer-Encoding': 'chunked' })
}

function sizedRequest(body: string): MockPayloadRequest {
  return buildRequest(body, { 'Content-Length': String(Buffer.byteLength(body)) })
}

async function parseBody(req: MockPayloadRequest): Promise<void> {
  // @ts-expect-error intentionally partial PayloadRequest mock, see MockPayloadRequest above
  await addDataAndFileToRequest(req)
}

describe('addDataAndFileToRequest with a multipart body', () => {
  const docData = { _status: 'draft', title: 'Workshops & Programs' }
  const body = buildMultipartBody({ _payload: JSON.stringify(docData) })

  it('populates req.data when Content-Length is absent (chunked upload)', async () => {
    const req = chunkedRequest(body)
    expect(req.headers.get('Content-Length')).toBeNull()

    await parseBody(req)

    // Without the patch this is undefined, which is what makes the update
    // operation throw on `data._status`.
    expect(req.data).toEqual(docData)
  })

  it('still populates req.data when Content-Length is present', async () => {
    const req = sizedRequest(body)
    expect(req.headers.get('Content-Length')).toBe(String(Buffer.byteLength(body)))

    await parseBody(req)

    expect(req.data).toEqual(docData)
  })

  it('leaves _status readable, as the update operation requires', async () => {
    const req = chunkedRequest(body)

    await parseBody(req)

    expect(req.data?._status).toBe('draft')
  })
})
