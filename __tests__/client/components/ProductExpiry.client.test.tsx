import { ProductExpiry } from '@/components/forecast/ProductExpiry'
import '@testing-library/jest-dom'
import { act, render } from '@testing-library/react'

/**
 * The server half of the expiry notice, shared by the zone page's validity banner and the
 * all-zones grid's cards. It owns one decision — what the server believed when it rendered — and
 * the client half owns keeping that honest.
 */
describe('ProductExpiry', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders nothing for a product with no expiry', () => {
    const { container } = render(<ProductExpiry forecast={{ expires_time: null }} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('marks a product that had already lapsed when the page rendered', () => {
    const { container } = render(
      <ProductExpiry forecast={{ expires_time: new Date(Date.now() - 60_000).toISOString() }} />,
    )

    expect(container.textContent).toMatch(/this product is expired/i)
  })

  it('says nothing yet for a product still inside its window, then marks it on the clock', async () => {
    const { container } = render(
      <ProductExpiry forecast={{ expires_time: new Date(Date.now() + 60_000).toISOString() }} />,
    )
    expect(container).toBeEmptyDOMElement()

    await act(async () => {
      jest.advanceTimersByTime(60_001)
    })

    expect(container.textContent).toMatch(/this product is expired/i)
  })
})
