## Actual changes in JSON snapshots

Adds a new `label` column to all navigation items tables:

- navigations_weather_items
- navigations_education_items
- navigations_accidents_items
- navigations_blog_items
- navigations_events_items
- navigations_about_items
- navigations_support_items
- \_navigations_v_version_weather_items
- \_navigations_v_version_education_items
- \_navigations_v_version_accidents_items
- \_navigations_v_version_blog_items
- \_navigations_v_version_events_items
- \_navigations_v_version_about_items
- \_navigations_v_version_support_items

## What caused these changes

Navigation items can either be:

1. **Direct links** - A single clickable item with a label and URL
2. **Accordion/section items** - A parent item with sub-items that expand on click

Previously, both modes used the same `link` field group, which stored `link_label`, `link_type`, `link_url`, and `link_new_tab`. This caused issues because accordion items don't actually use the link - they just display a label and expand to show sub-items.

The fix in `src/collections/Navigations/fields/itemsField.ts` introduced:

1. A standalone `label` field that is only shown when the item has sub-items
2. Conditional visibility so `link` fields only show when there are no sub-items
3. Hooks to sync and clear data appropriately when switching between modes

## Data migration

The migration performs these steps for items that have sub-items:

1. **Copy label**: Copies `link_label` to the new standalone `label` field (only if `label` is not already set)
2. **Clear link fields**: Sets `link_type`, `link_url`, `link_label`, and `link_new_tab` to NULL

This ensures existing accordion items have their label preserved in the correct field, and stale link data is cleaned up since it's not used for accordion items.

## Conclusion

This is a schema addition (new column) plus data migration to the new format. The `ALTER TABLE ... ADD` statements are safe and non-destructive. The UPDATE statements only modify rows that have sub-items, ensuring direct link items are unaffected.
