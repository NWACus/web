'use client'

import { getURL } from '@/utilities/getURL'
import { CopyToClipboard, FieldDescription, FieldLabel, TextInput, useField } from '@payloadcms/ui'

export function ManagementLink() {
  const { value: token } = useField<string>({ path: 'token' })

  const managementLink = token ? `${getURL()}/providers/${token}` : ''

  return (
    <div className="field-type">
      <div className="flex items-center gap-2">
        <FieldLabel htmlFor="managementLink" label="Provider's Management Link" />
        {managementLink && <CopyToClipboard value={managementLink} />}
      </div>
      <TextInput
        readOnly
        value={managementLink}
        path="managementLink"
        placeholder="Save this provider to generate their management link"
      />
      <FieldDescription
        description="This is the provider's unique link to manage their events. CAUTION: anyone with this link can create, edit, delete events on behalf of this provider. The provider will only be able to create events with sub types they are approved for."
        path="managementLink"
      />
    </div>
  )
}
