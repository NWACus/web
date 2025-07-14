import configPromise from '@payload-config'
import { Pill } from '@payloadcms/ui'
import { DefaultServerCellComponentProps, getPayload } from 'payload'

export async function StatusCell({ rowData }: DefaultServerCellComponentProps) {
  const payload = await getPayload({ config: configPromise })

  if (!rowData?.id) {
    return null
  }

  const user = await payload.findByID({
    collection: 'users',
    id: rowData.id,
    showHiddenFields: true,
    select: {
      inviteToken: true,
    },
  })

  if (!user) {
    return null
  }

  if (user.inviteToken) {
    return (
      <Pill size="small" pillStyle="warning">
        Invited
      </Pill>
    )
  }

  return <Pill size="small">Active</Pill>
}
