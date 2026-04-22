import { Pill } from '@payloadcms/ui'
import type { DefaultServerCellComponentProps } from 'payload'

export function OnboardingStatusCell({
  rowData,
}: Pick<DefaultServerCellComponentProps, 'rowData'>) {
  const status = rowData?.provisioning?.status
  if (status === 'complete')
    return (
      <Pill size="small" pillStyle="success">
        Complete
      </Pill>
    )
  if (status === 'partial')
    return (
      <Pill size="small" pillStyle="warning">
        Partial
      </Pill>
    )
  if (status === 'in_progress') return <Pill size="small">In progress</Pill>
  return <Pill size="small">Not started</Pill>
}
