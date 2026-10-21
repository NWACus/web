import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { DiscussionBody } from '@/components/forecast/DiscussionBody'
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

/** jsdom's pointer events carry no pointerType, and hover is mouse-only. */
function mouse(type: 'pointerover' | 'pointerout', element: Element, relatedTarget?: Element) {
  const event = new MouseEvent(type, { bubbles: true, relatedTarget })
  Object.defineProperty(event, 'pointerType', { value: 'mouse' })
  act(() => {
    element.dispatchEvent(event)
  })
}

const mouseOver = (element: Element) => mouse('pointerover', element)

const pause = (ms: number) => act(() => new Promise((resolve) => setTimeout(resolve, ms)))

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
    const link = screen.getByRole('link', {
      name: 'Learn more about Wind Slab (opens in a new tab)',
    })
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

    const link = await screen.findByRole('link', {
      name: 'Learn more about Wind Slab (opens in a new tab)',
    })
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

  it('keeps the learn-more link out of the tab order until the popover is pinned', async () => {
    renderProse()
    const term = await findTerm('wind slabs')
    act(() => term.focus())
    await screen.findByRole('dialog')
    expect(screen.getByRole('link', { hidden: true })).toHaveAttribute('tabindex', '-1')

    fireEvent.click(term)
    await waitFor(() => expect(screen.getByRole('link')).not.toHaveAttribute('tabindex'))
  })

  it('does not let a hover take over a keyboard preview', async () => {
    renderProse()
    const slabs = await findTerm('wind slabs')
    const cornice = await findTerm('cornice')
    act(() => slabs.focus())
    await screen.findByRole('dialog', { name: 'Wind Slab' })

    mouseOver(cornice)
    expect(screen.getByRole('dialog', { name: 'Wind Slab' })).toBeInTheDocument()
  })

  it('lets go of a pinned term once a corrected forecast replaces the prose', async () => {
    const { rerender } = renderProse()
    fireEvent.click(await findTerm('wind slabs'))
    await screen.findByRole('dialog')

    rerender(
      <ForecastGlossary center={center(true)}>
        <GlossaryProse html="<p>A cornice and wind slabs.</p>" className="prose" />
      </ForecastGlossary>,
    )
    const cornice = await findTerm('cornice')
    mouseOver(cornice)
    expect(await screen.findByRole('dialog', { name: 'Cornice' })).toBeInTheDocument()
  })

  it('marks the forecast discussion without a term click opening the media lightbox', async () => {
    render(
      <ForecastGlossary center={center(true)}>
        <DiscussionBody html="<p>Watch for wind slabs.</p>" />
      </ForecastGlossary>,
    )
    fireEvent.click(await findTerm('wind slabs'))
    expect(await screen.findByRole('dialog', { name: 'Wind Slab' })).toBeInTheDocument()
  })

  it('keeps a hover preview open while the pointer crosses another term on its way in', async () => {
    renderProse()
    const slabs = await findTerm('wind slabs')
    const cornice = await findTerm('cornice')
    mouseOver(slabs)
    const dialog = await screen.findByRole('dialog', { name: 'Wind Slab' })

    mouse('pointerout', slabs, cornice)
    mouse('pointerover', cornice, slabs)
    mouse('pointerout', cornice, dialog)
    mouse('pointerover', dialog, cornice)
    await pause(400)
    expect(screen.getByRole('dialog', { name: 'Wind Slab' })).toBeInTheDocument()
  })

  it('switches to another term once the pointer rests on it', async () => {
    renderProse()
    const slabs = await findTerm('wind slabs')
    const cornice = await findTerm('cornice')
    mouseOver(slabs)
    await screen.findByRole('dialog', { name: 'Wind Slab' })

    mouse('pointerout', slabs, cornice)
    mouse('pointerover', cornice, slabs)
    expect(await screen.findByRole('dialog', { name: 'Cornice' })).toBeInTheDocument()
  })

  it('closes a hover preview once the pointer has left both the term and the popover', async () => {
    renderProse()
    const slabs = await findTerm('wind slabs')
    mouseOver(slabs)
    await screen.findByRole('dialog')

    mouse('pointerout', slabs, document.body)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
