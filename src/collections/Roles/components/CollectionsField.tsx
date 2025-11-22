import { TextFieldServerComponent } from 'payload'

import { SelectField } from '@payloadcms/ui'

export const CollectionsField: TextFieldServerComponent = async ({
  payload,
  path,
  field,
  clientField,
  readOnly,
}) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const fieldPath = (path || field?.name || '') as string
  const { type: _type, admin, ...clientFields } = clientField

  return (
    <SelectField
      field={{
        type: 'select',
        // @ts-expect-error these are different field types which is leading to different expected types
        admin: { ...admin, isClearable: false, isSortable: false },
        ...clientFields,
        options: Object.keys(payload.collections).map((slug) => ({ label: slug, value: slug })),
      }}
      path={fieldPath}
      readOnly={readOnly === undefined ? true : readOnly}
    />
  )
}
