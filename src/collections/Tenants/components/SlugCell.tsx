import type { DefaultServerCellComponentProps } from 'payload'

export function SlugCell({ cellData }: Pick<DefaultServerCellComponentProps, 'cellData'>) {
  if (typeof cellData !== 'string') return null
  return <>{cellData.toUpperCase()}</>
}
