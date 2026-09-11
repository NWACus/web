/**
 * The archive filters mount twice on every page: once in the desktop sidebar and once inside
 * MobileFiltersDrawer, which keeps its children mounted and only slides the drawer out of view.
 * Fixed ids would therefore be duplicated, and a label's `for` resolves by document order, so one
 * copy's visible controls would end up labelled by nothing and its labels would click the other
 * copy's hidden buttons.
 */
import { ArchiveDateFilter } from '@/components/forecast/archive/ArchiveDateFilter.client'
import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'

const PROPS = {
  seasons: [
    { value: 2026, label: 'Current Season' },
    { value: 2025, label: '2024-2025 Season' },
  ],
  season: 2026,
  currentSeason: 2026,
  window: { from: '2025-09-01', to: '2026-08-31' },
  from: '2025-09-01',
  to: '2026-04-30',
  defaultRange: { from: '2025-09-01', to: '2026-08-31' },
}

const COPIES = ['sidebar', 'drawer']

function renderBothCopies() {
  return render(
    <NuqsTestingAdapter>
      {COPIES.map((copy) => (
        <div key={copy} data-testid={copy}>
          <ArchiveDateFilter {...PROPS} />
        </div>
      ))}
    </NuqsTestingAdapter>,
  )
}

describe('ArchiveDateFilter', () => {
  it('labels the season and both date fields', () => {
    render(
      <NuqsTestingAdapter>
        <ArchiveDateFilter {...PROPS} />
      </NuqsTestingAdapter>,
    )

    expect(screen.getByLabelText('Season')).toBeInTheDocument()
    expect(screen.getByLabelText('Start date')).toBeInTheDocument()
    expect(screen.getByLabelText('End date')).toBeInTheDocument()
  })

  it('gives every control in a second copy its own id', () => {
    const { container } = renderBothCopies()

    const ids = Array.from(container.querySelectorAll('[id]')).map((element) => element.id)

    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(COPIES)('binds every label in the %s copy to a control inside it', (copy) => {
    renderBothCopies()

    const scope = screen.getByTestId(copy)
    const labels = Array.from(scope.querySelectorAll('label[for]'))

    expect(labels).toHaveLength(3)
    for (const label of labels) {
      const target = document.getElementById(label.getAttribute('for') ?? '')
      expect(target).not.toBeNull()
      expect(scope.contains(target)).toBe(true)
    }
  })

  it.each(COPIES)('names both date fields in the %s copy', (copy) => {
    renderBothCopies()

    const scope = within(screen.getByTestId(copy))

    expect(scope.getByLabelText('Start date')).toBeInTheDocument()
    expect(scope.getByLabelText('End date')).toBeInTheDocument()
  })
})
