## Actual changes in JSON snapshots

Drops the `station_pages_columns` table (the page-level "Table columns" select) and adds `column_order` (`text DEFAULT '[]'`) to `station_pages`.

## What caused these changes

A station page now hides readings per station, stored as an optional `hidden` list on each entry of the existing `stations` JSON, and orders its columns with the new `columnOrder` JSON field (one `{ source, stid, variable }` entry per column). The old select filtered and ordered readings for every station at once.

## Data

The old selection is not carried over. A "show only these readings" list can't become a per-station `hidden` list without knowing what each station reports, and every station now shows new readings automatically. After deploying, a page that used the select shows every reading its stations report, in the default order, until an editor hides readings per station. `hidden` lives inside the existing `stations` JSON, so it needs no schema change.

`down` recreates the empty table and drops `column_order`.

## Conclusion

`migrate:check` flags the `DROP TABLE`. It is intended: the old selection is deliberately not migrated, as above.
