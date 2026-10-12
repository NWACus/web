'use client'

import { SaveButton, useTranslation } from '@payloadcms/ui'

// Station pages have no drafts, so Payload labels their button "Save"; Pages
// say "Publish changes", and an edit here is just as live.
export const PublishChangesButton = () => {
  const { t } = useTranslation()
  return <SaveButton label={t('version:publishChanges')} />
}
