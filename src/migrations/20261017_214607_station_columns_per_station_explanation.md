## Actual changes in JSON snapshots

Drops the `station_pages_columns` table (the page-level "Table columns" select) and adds `column_order` (`text DEFAULT '[]'`) to `station_pages`.

## What caused these changes

A station page now chooses table readings per station, stored as an optional `columns` list on each entry of the existing `stations` JSON, and orders the resulting columns with the new `columnOrder` JSON field (one `{ source, stid, variable }` entry per column). The old select both filtered and ordered readings for every station at once.

## Data

Before the drop, `up` copies each page's chosen readings onto every one of its stations as `columns`. If the page had put the readings in a non-default order, it also writes a `column_order` with one entry per reading and station in that order, so the public table is unchanged. Pages that chose no readings are untouched: every station stays on "all readings" and the order stays default.

`down` is lossy: it recreates the table with every reading any station chose, in the default order, and strips `columns` from the stations.

## Conclusion

`migrate:check` flags the `DROP TABLE`. It is intended, and runs only after the table's rows have been copied into `stations` and `column_order`.
