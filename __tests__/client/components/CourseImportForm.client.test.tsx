import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import type { CourseImportPlan, PlannedCourse } from '@/services/courseImport/planCourseImport'
import { CourseImportForm } from '@/views/CourseImport/CourseImportForm'

const mockPreview = jest.fn()
const mockRun = jest.fn()

jest.mock('../../../src/views/CourseImport/actions', () => ({
  previewCourseImport: (...args: unknown[]) => mockPreview(...args),
  runCourseImport: (...args: unknown[]) => mockRun(...args),
}))

jest.mock('@payloadcms/ui', () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode
    onClick: () => void
    disabled?: boolean
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  toast: { success: jest.fn(), error: jest.fn() },
}))

const course = (row: number, title: string): PlannedCourse => ({
  row,
  provider: 'Snowbird Mountain Guides',
  title,
  start: '1/21/2027 8:00 AM',
  // @ts-expect-error -- the form only shows the summary and passes data back untouched
  data: {},
})

const plan: CourseImportPlan = {
  fileErrors: [],
  ready: [course(2, 'Recreational Level 1 – Ski')],
  blocked: [
    {
      row: 3,
      provider: 'Unknown Guides',
      title: 'Recreational Level 1 – Ski',
      start: '1/22/2027 8:00 AM',
      reasons: ['Provider "Unknown Guides" not found.'],
    },
  ],
  likelyDuplicates: [course(4, 'Avalanche Rescue – Ski')],
}

function upload(text: string) {
  const input = screen.getByLabelText('Course spreadsheet (CSV)')
  const file = new File([text], 'courses.csv', { type: 'text/csv' })
  // jsdom's File has no text(); the form reads the upload through it
  Object.defineProperty(file, 'text', { value: async () => text })
  fireEvent.change(input, { target: { files: [file] } })
}

describe('CourseImportForm', () => {
  beforeEach(() => {
    mockPreview.mockReset()
    mockRun.mockReset()
  })

  it('previews the upload as ready, blocked and likely duplicate rows', async () => {
    mockPreview.mockResolvedValue({ ok: true, plan })
    render(<CourseImportForm />)
    upload('csv text')

    expect(await screen.findByText('Ready to import · 1')).toBeInTheDocument()
    expect(mockPreview).toHaveBeenCalledWith('csv text')
    expect(screen.getByText('Blocked · 1')).toBeInTheDocument()
    expect(screen.getByText('Provider "Unknown Guides" not found.')).toBeInTheDocument()
    expect(screen.getByText('Likely duplicates · 1')).toBeInTheDocument()
    // The button stays disabled until the preview transition settles
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Import 1 course' })).toBeEnabled(),
    )
  })

  it('imports the ready rows plus only the duplicates that were ticked', async () => {
    mockPreview.mockResolvedValue({ ok: true, plan })
    mockRun.mockResolvedValue({
      ok: true,
      created: [plan.ready[0], plan.likelyDuplicates[0]],
      skipped: [],
      blocked: plan.blocked,
    })
    render(<CourseImportForm />)
    upload('csv text')

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Import row 4 anyway' }))
    fireEvent.click(screen.getByRole('button', { name: 'Import 2 courses' }))

    await waitFor(() => expect(mockRun).toHaveBeenCalledWith('csv text', [4]))
    expect(await screen.findByRole('status')).toHaveTextContent('Imported 2 courses.')
  })

  it('shows every row and what happened to it after importing', async () => {
    mockPreview.mockResolvedValue({ ok: true, plan })
    mockRun.mockResolvedValue({
      ok: true,
      created: plan.ready,
      skipped: plan.likelyDuplicates,
      blocked: plan.blocked,
    })
    render(<CourseImportForm />)
    upload('csv text')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Import 1 course' })).toBeEnabled(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Import 1 course' }))

    const imported = await screen.findByRole('region', { name: 'Imported' })
    expect(within(imported).getByText('Row 2 · Recreational Level 1 – Ski')).toBeInTheDocument()
    const notImported = screen.getByRole('region', { name: 'Not imported' })
    expect(
      within(notImported).getByText('Provider "Unknown Guides" not found.'),
    ).toBeInTheDocument()
    const skipped = screen.getByRole('region', { name: 'Skipped duplicates' })
    expect(within(skipped).getByText('Row 4 · Avalanche Rescue – Ski')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Import/ })).not.toBeInTheDocument()
  })

  it('shows problems with the file itself instead of a preview', async () => {
    mockPreview.mockResolvedValue({
      ok: true,
      plan: { ...plan, fileErrors: ['Missing columns: End Time.'] },
    })
    render(<CourseImportForm />)
    upload('csv text')

    expect(await screen.findByText('Missing columns: End Time.')).toBeInTheDocument()
    expect(screen.queryByText('Ready to import · 1')).not.toBeInTheDocument()
  })

  it('shows an error from the server', async () => {
    mockPreview.mockResolvedValue({
      ok: false,
      error: 'Only Provider Managers can run a Course Import.',
    })
    render(<CourseImportForm />)
    upload('csv text')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Only Provider Managers can run a Course Import.',
    )
  })

  it('has nothing to import when every row is blocked', async () => {
    mockPreview.mockResolvedValue({ ok: true, plan: { ...plan, ready: [] } })
    render(<CourseImportForm />)
    upload('csv text')

    expect(await screen.findByRole('button', { name: 'Nothing to import' })).toBeDisabled()
  })
})
