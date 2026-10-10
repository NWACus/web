## Actual changes in JSON snapshots

Adds three columns to `station_pages`: `tabs_table`, `tabs_graphs` and `tabs_csv`, each `integer DEFAULT true`.

## What caused these changes

The station page's new sidebar "Tabs" group, three checkboxes that show or hide the page's Table, Graphs and Download tabs.

## Conclusion

Additive only. Existing rows take the `true` default, so every page keeps all three tabs until an admin hides one. The `migrate:check` warnings are the three `ALTER TABLE ... ADD` statements, which drop nothing.
