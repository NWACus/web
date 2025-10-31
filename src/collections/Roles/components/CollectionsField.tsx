import { Option, TextFieldServerComponent } from 'payload'

import { SelectField } from '@payloadcms/ui'

export const CollectionsField: TextFieldServerComponent = async (props) => {
  const { payload, path, field, clientField, readOnly } = props
  const fieldPath = (path || field?.name || '') as string
  const { type: _type, admin, ...clientFields } = clientField

  // Get includeGlobals from serverProps
  const serverProps =
    typeof field.admin?.components?.Field === 'object' &&
    'serverProps' in field.admin.components.Field &&
    typeof field.admin.components.Field.serverProps === 'object' &&
    'includeGlobals' in field.admin.components.Field.serverProps
      ? field.admin.components.Field.serverProps
      : null
  const includeGlobals = serverProps?.includeGlobals ?? false

  const collectionOptions = payload.config.collections.map(({ slug }) => slug)

  let options: Option[] = collectionOptions

  if (includeGlobals) {
    const globalOptions = payload.config.globals.map(({ slug }) => slug)
    options = options.concat(globalOptions)
  }

  return (
    <SelectField
      field={{
        type: 'select',
        // @ts-expect-error these are different field types which is leading to different expected types
        admin: { ...admin, isClearable: false, isSortable: false },
        ...clientFields,
        options,
      }}
      path={fieldPath}
      readOnly={readOnly === undefined ? true : readOnly}
    />
  )
}
