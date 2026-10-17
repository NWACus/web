'use client'

import { FieldLabel, useFormFields } from '@payloadcms/ui'
import type { RelationshipFieldLabelClientComponent } from 'payload'

// Mirrors validateItemReference in itemsField: a section header's page is optional
export const ItemLinkReferenceLabel: RelationshipFieldLabelClientComponent = ({ field, path }) => {
  // <tab>.items.<i>.link.reference → <tab>.items.<i>.items, the nav item's sub-items
  const subItemsPath = path?.replace(/\.link\.reference$/, '.items')
  // An array field's form state value is its row count
  const hasSubItems = useFormFields(([fields]) =>
    subItemsPath ? Number(fields[subItemsPath]?.value) > 0 : false,
  )

  return <FieldLabel label={field?.label} path={path} required={!hasSubItems} />
}
