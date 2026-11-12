import { parseWith, useReport, type ReportRequest } from '@/views/Analytics/useReport'
import { act, renderHook, waitFor } from '@testing-library/react'
import { z } from 'zod'

const parse = parseWith(z.object({ n: z.number() }))

const RANGE = {
  from: '2026-10-01',
  to: '2026-10-31',
  previousFrom: '2026-08-31',
  previousTo: '2026-09-30',
  baseline: 'preceding',
  timezone: 'America/Los_Angeles',
}

const REQUEST: ReportRequest = {
  center: 'nwac',
  from: '2026-10-01',
  to: '2026-10-31',
  generation: 0,
  force: false,
}

const respond = (n: number) => ({ ok: true, json: async () => ({ range: RANGE, data: { n } }) })

const fetchMock = jest.fn()

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => respond(1))
  global.fetch = fetchMock
})

function renderReport(request: ReportRequest) {
  return renderHook(({ request }) => useReport('overview', request, parse), {
    initialProps: { request },
  })
}

describe('useReport', () => {
  it("never renders the previous request's data for a new request", async () => {
    const rendered: string[] = []
    const { result, rerender } = renderHook(
      ({ request }) => {
        const state = useReport('overview', request, parse)
        rendered.push(state.status)
        return state
      },
      { initialProps: { request: REQUEST } },
    )
    await waitFor(() => expect(result.current.status).toBe('ready'))

    fetchMock.mockImplementation(() => new Promise(() => {}))
    rendered.length = 0
    rerender({ request: { ...REQUEST, generation: 1 } })
    expect(rendered[0]).toBe('loading')
  })

  it('ignores a superseded response whose body fails after the abort', async () => {
    let failBody: (reason: Error) => void = () => {}
    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      json: () =>
        new Promise((_, reject) => {
          failBody = reject
        }),
    }))
    fetchMock.mockImplementationOnce(async () => respond(2))

    const { result, rerender } = renderReport(REQUEST)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    rerender({ request: { ...REQUEST, generation: 1 } })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(async () => failBody(new Error('aborted')))
    expect(result.current).toMatchObject({ status: 'ready', data: { n: 2 } })
  })
})
