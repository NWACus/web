import type { DefaultServerCellComponentProps } from 'payload'

export function TenantSlugCell({ cellData }: Pick<DefaultServerCellComponentProps, 'cellData'>) {
  if (typeof cellData !== 'string') return null
  return <>{cellData}</>
}
