import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { ForecastGlossary } from '@/components/glossary/ForecastGlossary'
import { GlossaryProse } from '@/components/glossary/GlossaryProse.client'
import type { GlossaryEntry } from '@/services/glossary/glossaryEntry'

const TERMS: GlossaryEntry[] = [
  {
    term: 'Wind Slab',
    aliases: ['wind slabs'],
    definition: 'A cohesive layer of snow formed when wind deposits snow.',
    link: 'https://avalanche.org/avalanche-encyclopedia/wind-slab/',
  },
  { term: 'Cornice', aliases: [], definition: 'An overhanging mass of snow.', link: null },
]

const mockFetch = jest.fn()

beforeEach(() => {
  mockFetch.mockReset()
  mockFetch.mockResolvedValue({ ok: true, json: async () => TERMS })
  global.fetch = mockFetch
})

const PROSE = '<p>Watch for wind slabs near a cornice.</p><h2>Wind Slab</h2>'

const FORECAST_CONFIG = { color: '', elevInfoUrl: '', tabs: [] }
const center = (glossary: boolean) => ({
  widget_config: { forecast: { ...FORECAST_CONFIG, glossary } },
})

function renderProse(enabled = true, html = PROSE) {
  return render(
    <ForecastGlossary center={center(enabled)}>
      <GlossaryProse html={html} className="prose" />
    </ForecastGlossary>,
  )
}

async function findTerm(name: string): Promise<HTMLElement> {
  return screen.findByRole('button', { name })
}

describe('forecast glossary', () => {
  it('renders the prose unchanged before the terms arrive', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    const { container } = renderProse()
    expect(container.querySelector('.prose')?.innerHTML).toBe(PROSE)
  })

  it('fetches the terms from the glossary endpoint and marks them in the prose', async () => {
    renderProse()
    expect(await findTerm('wind slabs')).toBeInTheDocument()
    expect(await findTerm('cornice')).toBeInTheDocument()
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch.mock.calls[0][0]).toBe('/api/glossary')
    // Headings are never marked.
    expect(screen.getByRole('heading', { name: 'Wind Slab' })).toBeInTheDocument()
  })

  it('does not fetch or mark anything when the center has the glossary off', async () => {
    const { container } = renderProse(false)
    await act(async () => {})
    expect(mockFetch).not.toHaveBeenCalled()
    expect(container.querySelector('.prose')?.innerHTML).toBe(PROSE)
  })

  it('leaves the prose readable when the endpoint fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Glossary unavailable' }),
    })
    const { container } = renderProse()
    await act(async () => {})
    expect(container.querySelector('.prose')?.innerHTML).toBe(PROSE)
  })

  it('ignores a response that is not a term list', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ unexpected: true }) })
    const { container } = renderProse()
    await act(async () => {})
    expect(container.querySelector('.prose')?.innerHTML).toBe(PROSE)
  })

  it('shows the definition and learn-more link on click without navigating, and closes on a second click', async () => {
    renderProse()
    const term = await findTerm('wind slabs')

    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    act(() => {
      term.dispatchEvent(click)
    })

    const dialog = await screen.findByRole('dialog', { name: 'Wind Slab' })
    expect(dialog).toHaveTextContent('A cohesive layer of snow formed when wind deposits snow.')
    const link = screen.getByRole('link', { name: 'Learn more on avalanche.org →' })
    expect(link).toHaveAttribute('href', TERMS[0].link)
    expect(link).toHaveAttribute('target', '_blank')
    expect(term).toHaveAttribute('aria-expanded', 'true')
    expect(click.defaultPrevented).toBe(true)

    fireEvent.click(term)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(term).toHaveAttribute('aria-expanded', 'false')
  })

  it('omits the learn-more link for a term without one', async () => {
    renderProse()
    fireEvent.click(await findTerm('cornice'))
    expect(await screen.findByRole('dialog', { name: 'Cornice' })).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders the popover right after the term, so it follows it in the tab order', async () => {
    renderProse()
    const term = await findTerm('wind slabs')
    fireEvent.click(term)
    const dialog = await screen.findByRole('dialog')
    expect(term.nextElementSibling?.contains(dialog)).toBe(true)
  })

  it('opens from the keyboard, moves focus to the link, and Escape returns focus to the term', async () => {
    renderProse()
    const term = await findTerm('wind slabs')
    act(() => term.focus())
    fireEvent.keyDown(term, { key: 'Enter' })

    const link = await screen.findByRole('link', { name: 'Learn more on avalanche.org →' })
    await waitFor(() => expect(link).toHaveFocus())

    fireEvent.keyDown(link, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(term).toHaveFocus()
  })

  it('previews on focus and closes when focus leaves', async () => {
    renderProse()
    const term = await findTerm('cornice')
    act(() => term.focus())
    expect(await screen.findByRole('dialog', { name: 'Cornice' })).toBeInTheDocument()

    act(() => term.blur())
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('marks new prose when the HTML changes', async () => {
    const { rerender } = renderProse()
    await findTerm('wind slabs')
    rerender(
      <ForecastGlossary center={center(true)}>
        <GlossaryProse html="<p>A new cornice formed.</p>" className="prose" />
      </ForecastGlossary>,
    )
    expect(await findTerm('cornice')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'wind slabs' })).not.toBeInTheDocument()
  })
})
