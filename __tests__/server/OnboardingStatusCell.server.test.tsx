jest.mock('@payloadcms/ui', () => ({
  Pill: ({
    children,
    pillStyle,
    size,
  }: {
    children: React.ReactNode
    pillStyle?: string
    size?: string
  }) => ({ type: 'Pill', props: { children, pillStyle, size } }),
}))

// Must import after mock setup
import { OnboardingStatusCell } from '@/collections/Tenants/components/OnboardingStatusCell'

function isReactElement(value: unknown): value is React.ReactElement<{
  children: string
  pillStyle?: string
  size?: string
}> {
  return value !== null && typeof value === 'object' && 'props' in value
}

const cellFor = (
  status: 'complete' | 'partial' | 'manual' | 'in_progress' | 'not_started' | undefined,
) => OnboardingStatusCell({ rowData: { provisioning: { status } } })

describe('OnboardingStatusCell', () => {
  it('renders Complete pill for complete status', () => {
    const result = cellFor('complete')

    if (!isReactElement(result)) throw new Error('Expected ReactElement')
    expect(result.props.children).toBe('Complete')
    expect(result.props.pillStyle).toBe('success')
    expect(result.props.size).toBe('small')
  })

  it('renders Partial pill with warning style for partial status', () => {
    const result = cellFor('partial')

    if (!isReactElement(result)) throw new Error('Expected ReactElement')
    expect(result.props.children).toBe('Partial')
    expect(result.props.pillStyle).toBe('warning')
  })

  it('renders Not started pill for not_started status', () => {
    const result = cellFor('not_started')

    if (!isReactElement(result)) throw new Error('Expected ReactElement')
    expect(result.props.children).toBe('Not started')
  })

  it('renders In progress pill for in_progress status', () => {
    const result = cellFor('in_progress')

    if (!isReactElement(result)) throw new Error('Expected ReactElement')
    expect(result.props.children).toBe('In progress')
  })

  it('renders Manual actions pill for manual status', () => {
    const result = cellFor('manual')

    if (!isReactElement(result)) throw new Error('Expected ReactElement')
    expect(result.props.children).toBe('Manual actions')
    expect(result.props.pillStyle).toBe('warning')
  })

  it('renders Not started pill when provisioning is missing', () => {
    // Happens before provisioning has ever been written to the tenant
    const result = OnboardingStatusCell({ rowData: {} })

    if (!isReactElement(result)) throw new Error('Expected ReactElement')
    expect(result.props.children).toBe('Not started')
  })

  it('renders Not started pill when provisioning.status is undefined', () => {
    const result = OnboardingStatusCell({ rowData: { provisioning: {} } })

    if (!isReactElement(result)) throw new Error('Expected ReactElement')
    expect(result.props.children).toBe('Not started')
  })
})
