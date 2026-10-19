import type { Config, Field } from 'payload'

// Bulk edit only skips fields that are hidden at the top level (`hidden: true`), not ones hidden
// from the admin (`admin.hidden`), so it offered internals like contentHash, prefix and the storage
// plugin's _objectKey. A field the edit view never shows is never meant to be bulk edited.
const disableBulkEditOf = (fields: Field[]): void => {
  for (const field of fields) {
    if ('name' in field && field.admin && 'hidden' in field.admin && field.admin.hidden === true) {
      field.admin.disableBulkEdit = true
    }
    if ('fields' in field) {
      disableBulkEditOf(field.fields)
    }
    if ('tabs' in field) {
      for (const tab of field.tabs) {
        disableBulkEditOf(tab.fields)
      }
    }
  }
}

/**
 * Must run after every plugin that adds fields, so it is the last plugin.
 */
export const disableBulkEditOfHiddenFields = <T extends Pick<Config, 'collections'>>(
  config: T,
): T => {
  for (const collection of config.collections ?? []) {
    disableBulkEditOf(collection.fields)
  }
  return config
}
