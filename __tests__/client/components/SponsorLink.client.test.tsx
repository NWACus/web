import { SponsorLink } from '@/blocks/Sponsors/components/SponsorLink'
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'

const mockCapture = jest.fn()

jest.mock('../../../src/utilities/useAnalytics', () => ({
  useAnalytics: () => ({ capture: mockCapture }),
}))

const sponsor = {
  id: 7,
  name: 'Acme Outfitters',
  link: 'https://acme.example.com',
}

const impression = { sponsor_id: '7', sponsor_name: 'Acme Outfitters' }

const observers = new Set<FakeIntersectionObserver>()

class FakeIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds: number[]
  private readonly targets = new Set<Element>()

  constructor(
    private readonly callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.thresholds = [options?.threshold ?? 0].flat()
    observers.add(this)
  }

  observe(target: Element) {
    this.targets.add(target)
  }
  unobserve(target: Element) {
    this.targets.delete(target)
  }
  disconnect() {
    this.targets.clear()
  }
  takeRecords() {
    return []
  }

  report(intersectionRatio: number) {
    const entries = [...this.targets].map((target) => ({
      target,
      intersectionRatio,
      isIntersecting: intersectionRatio > 0,
      boundingClientRect: target.getBoundingClientRect(),
      intersectionRect: target.getBoundingClientRect(),
      rootBounds: null,
      time: 0,
    }))
    if (entries.length > 0) this.callback(entries, this)
  }
}

function scrollTo(intersectionRatio: number) {
  act(() => observers.forEach((observer) => observer.report(intersectionRatio)))
}

function wait(ms: number) {
  act(() => jest.advanceTimersByTime(ms))
}

function renderLink() {
  return render(
    <SponsorLink sponsor={sponsor}>
      <span>Acme Outfitters</span>
    </SponsorLink>,
  )
}

function impressionCount() {
  return mockCapture.mock.calls.filter(([event]) => event === 'sponsor_impression').length
}

describe('SponsorLink', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockCapture.mockClear()
    observers.clear()
    window.IntersectionObserver = FakeIntersectionObserver
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('captures no impression while the link is below the fold', () => {
    renderLink()

    scrollTo(0)
    wait(5000)

    expect(mockCapture).not.toHaveBeenCalled()
  })

  it('captures no impression while less than half the link is visible', () => {
    renderLink()

    scrollTo(0.49)
    wait(5000)

    expect(mockCapture).not.toHaveBeenCalled()
  })

  it('asks to be told when half the link is visible', () => {
    renderLink()

    expect([...observers].map((observer) => observer.thresholds)).toEqual([[0.5]])
  })

  it('captures an impression once half the link has been visible for a second', () => {
    renderLink()

    scrollTo(0.5)
    wait(999)
    expect(mockCapture).not.toHaveBeenCalled()

    wait(1)
    expect(mockCapture).toHaveBeenCalledTimes(1)
    expect(mockCapture).toHaveBeenCalledWith('sponsor_impression', impression)
  })

  it('captures no impression when the link scrolls past in under a second', () => {
    renderLink()

    scrollTo(1)
    wait(500)
    scrollTo(0)
    wait(5000)

    expect(mockCapture).not.toHaveBeenCalled()
  })

  it('starts the second over when the link returns', () => {
    renderLink()

    scrollTo(1)
    wait(900)
    scrollTo(0)
    scrollTo(1)
    wait(900)
    expect(mockCapture).not.toHaveBeenCalled()

    wait(100)
    expect(impressionCount()).toBe(1)
  })

  it('captures no impression when the link unmounts within the second', () => {
    const { unmount } = renderLink()

    scrollTo(1)
    unmount()
    wait(5000)

    expect(mockCapture).not.toHaveBeenCalled()
  })

  it('captures no second impression when the link scrolls away and back', () => {
    renderLink()

    scrollTo(1)
    wait(1000)
    scrollTo(0)
    scrollTo(1)
    wait(5000)

    expect(impressionCount()).toBe(1)
  })

  it('captures an impression for each placement of a sponsor on a page', () => {
    render(
      <>
        <SponsorLink sponsor={sponsor}>First</SponsorLink>
        <SponsorLink sponsor={sponsor}>Second</SponsorLink>
      </>,
    )

    scrollTo(1)
    wait(1000)

    expect(impressionCount()).toBe(2)
  })

  it('captures a sponsor_click when the link is clicked', () => {
    renderLink()

    fireEvent.click(screen.getByRole('link'))

    expect(mockCapture).toHaveBeenCalledTimes(1)
    expect(mockCapture).toHaveBeenCalledWith('sponsor_click', impression)
  })
})
