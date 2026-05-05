This is a combination of a few migrations that were merged into main before landing in production that would have been difficult to regenerate appropriately. See the diff for changes.

This:

1. Creates `documentReferences` fields on both routable collections and intermediate collections
2. Drops old block tracking fields
3. Creates the nac widgets config `devMode` field
