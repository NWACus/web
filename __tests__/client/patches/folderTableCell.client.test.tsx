// Guards patches/@payloadcms__ui@3.90.2.patch. Delete with the patch once Payload ships the fix.
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { FolderTableCellClient } from '../../../node_modules/@payloadcms/ui/dist/elements/FolderView/Cell/index.client.js'

type FolderDocs = Record<string, Record<string, { name: string } | false | null>>

const mockGetRelationships = jest.fn()
let mockDocuments: FolderDocs = {}

jest.mock('../../../node_modules/@payloadcms/ui/dist/exports/client/index.js', () => ({
  MoveDocToFolderButton: ({ fromFolderName }: { fromFolderName: string }) => (
    <button>{fromFolderName}</button>
  ),
  useConfig: () => ({ config: { routes: { api: '/api' } } }),
  useListRelationships: () => ({
    documents: mockDocuments,
    getRelationships: mockGetRelationships,
  }),
  useTranslation: () => ({ t: (key: string) => key }),
}))

const fetchSpy = jest.fn()

beforeEach(() => {
  mockGetRelationships.mockClear()
  fetchSpy.mockClear()
  global.fetch = fetchSpy
  mockDocuments = {}
})

function cell(folder: number | null) {
  return (
    <FolderTableCellClient
      collectionSlug="media"
      data={{ id: 1, folder }}
      docTitle="photo.webp"
      folderCollectionSlug="payload-folders"
      folderFieldName="folder"
      viewType="list"
    />
  )
}

describe('FolderTableCellClient (patched)', () => {
  it('shows No Folder without requesting anything', () => {
    render(cell(null))

    expect(screen.getByRole('button')).toHaveTextContent('folder:noFolder')
    expect(mockGetRelationships).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("requests the folder through the list's batched relationship loader", () => {
    render(cell(5))

    expect(mockGetRelationships).toHaveBeenCalledWith([{ relationTo: 'payload-folders', value: 5 }])
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.getByRole('button')).toHaveTextContent('general:loading...')
  })

  it('follows the row data when the list refreshes after a bulk edit', () => {
    mockDocuments = { 'payload-folders': { 5: { name: 'Blog Images' }, 4: { name: 'Brand' } } }
    const { rerender } = render(cell(5))
    expect(screen.getByRole('button')).toHaveTextContent('Blog Images')

    rerender(cell(4))
    expect(screen.getByRole('button')).toHaveTextContent('Brand')

    rerender(cell(null))
    expect(screen.getByRole('button')).toHaveTextContent('folder:noFolder')
  })
})
