import { DocumentBlockComponent } from '@/blocks/Document/Component'
import type { Document } from '@/payload-types'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ComponentProps } from 'react'

jest.mock('../../../src/providers/TenantProvider', () => ({
  useTenant: () => ({ tenant: null }),
}))

const fileUrl = 'https://blob.example.com/documents/avalanche-report.pdf'

const document: Document = {
  id: 1,
  tenant: 1,
  url: fileUrl,
  filename: 'avalanche-report.pdf',
  updatedAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
}

type Props = ComponentProps<typeof DocumentBlockComponent>

function renderBlock(props: Partial<Props>) {
  return render(
    <DocumentBlockComponent
      blockType="documentBlock"
      document={document}
      displayAs="download"
      isLayoutBlock={false}
      {...props}
    />,
  )
}

describe('DocumentBlockComponent', () => {
  it('embeds the document in an iframe when displayAs is embed', () => {
    const { container } = renderBlock({ displayAs: 'embed' })

    expect(screen.getByTitle('Document')).toHaveAttribute('src', fileUrl)
    expect(container.querySelector('a')).toBeNull()
  })

  it('renders a download link when displayAs is download', () => {
    const { container } = renderBlock({ displayAs: 'download' })

    const link = screen.getByRole('link', { name: 'avalanche-report.pdf' })
    expect(link).toHaveAttribute('href', fileUrl)
    expect(link).toHaveAttribute('download', 'avalanche-report.pdf')
    // without a new tab, nextjs-toploader shows the page as navigating
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('renders nothing when the document is not populated', () => {
    const { container } = renderBlock({ document: 1 })

    expect(container).toBeEmptyDOMElement()
  })
})
