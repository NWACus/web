import configPromise from '@payload-config'
import { Pill } from '@payloadcms/ui'
import { DefaultServerCellComponentProps, getPayload, UIFieldServerProps } from 'payload'

export async function StatusField({ data }: UIFieldServerProps) {
  const payload = await getPayload({ config: configPromise })

  const user = await payload.findByID({
    collection: 'users',
    id: data.id,
    showHiddenFields: true,
    select: {
      inviteToken: true,
    },
  })

  if (!user) {
    return null
  }

  if (user.inviteToken) {
    return <Pill pillStyle="warning">Invited</Pill>
  }

  return null
}

export async function StatusCell({ rowData }: DefaultServerCellComponentProps) {
  const payload = await getPayload({ config: configPromise })

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
