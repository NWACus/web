import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

import { CoursePreviewSmallRow } from '@/components/CoursePreviewSmallRow'
import type { Course, Provider } from '@/payload-types'

const testProvider: Provider = {
  id: 1,
  name: 'Mountain Education Center',
  statesServiced: ['WA'],
  courseTypes: ['rec-1'],
  slug: 'mountain-education-center',
  updatedAt: '',
  createdAt: '',
}

const baseCourse: Course = {
  id: 1,
  title: 'AIARE Recreational Level 1',
  startDate: '2027-02-14T08:00:00.000Z',
  startDate_tz: 'America/Los_Angeles',
  endDate: '2027-02-16T17:00:00.000Z',
  endDate_tz: 'America/Los_Angeles',
  registrationDeadline_tz: 'America/Los_Angeles',
  location: {
    placeName: 'Mountain Education Center',
    city: 'Leavenworth',
    state: 'WA',
  },
  courseType: 'rec-1',
  provider: testProvider,
  updatedAt: '',
  createdAt: '',
}

describe('CoursePreviewSmallRow subtitle', () => {
  it('renders the subtitle below the title and provider line when present', () => {
    const doc: Course = {
      ...baseCourse,
      subtitle: '3-day comprehensive avalanche course',
    }
    render(<CoursePreviewSmallRow doc={doc} />)

    const title = screen.getByText('AIARE Recreational Level 1')
    const provider = screen.getByText('Provided by:').parentElement
    const subtitle = screen.getByText('3-day comprehensive avalanche course')

    expect(provider).toHaveTextContent('Provided by: Mountain Education Center')
    expect(title.compareDocumentPosition(subtitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(provider?.compareDocumentPosition(subtitle)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('renders the subtitle under the title for courses with courseUrl (external link)', () => {
    const doc: Course = {
      ...baseCourse,
      subtitle: '3-day comprehensive avalanche course',
      courseUrl: 'https://example.com/register',
    }
    render(<CoursePreviewSmallRow doc={doc} />)

    const link = screen.getByRole('link')
    const subtitle = within(link).getByText('3-day comprehensive avalanche course')
    expect(subtitle).toBeInTheDocument()
  })

  it('does not render an empty gap when no subtitle is provided', () => {
    const doc: Course = { ...baseCourse }
    render(<CoursePreviewSmallRow doc={doc} />)

    expect(screen.getByText('AIARE Recreational Level 1')).toBeInTheDocument()
    expect(screen.queryByText(/comprehensive/)).not.toBeInTheDocument()
  })

  it('does not show the subtitle again in the expanded details panel', () => {
    const doc: Course = {
      ...baseCourse,
      subtitle: '3-day comprehensive avalanche course',
      description: 'Learn essential avalanche safety skills.',
    }
    render(<CoursePreviewSmallRow doc={doc} />)

    // Subtitle should appear once (in the always-visible header)
    expect(screen.getAllByText('3-day comprehensive avalanche course')).toHaveLength(1)

    // Expand details
    fireEvent.click(screen.getByRole('button', { name: 'Expand details' }))

    // Subtitle should still appear only once (not duplicated in expanded panel)
    expect(screen.getAllByText('3-day comprehensive avalanche course')).toHaveLength(1)
    // The description should appear in the expanded panel
    expect(screen.getByText('Learn essential avalanche safety skills.')).toBeInTheDocument()
  })

  it('does not show an expand toggle when subtitle is the only extra detail', () => {
    const doc: Course = {
      ...baseCourse,
      subtitle: '3-day comprehensive avalanche course',
    }
    render(<CoursePreviewSmallRow doc={doc} />)

    expect(screen.getByText('3-day comprehensive avalanche course')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /expand/i })).not.toBeInTheDocument()
  })
})

describe('CoursePreviewSmallRow dates', () => {
  it('shows calendar dates only, with no time or timezone', () => {
    const { container } = render(<CoursePreviewSmallRow doc={baseCourse} />)

    const time = container.querySelector('time')
    expect(time).toHaveTextContent(/^Feb 14 - Feb 16, 2027$/)
    expect(time).toHaveAttribute('datetime', baseCourse.startDate)
  })
})
