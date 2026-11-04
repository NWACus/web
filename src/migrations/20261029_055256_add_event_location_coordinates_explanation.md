## Actual changes in JSON snapshots

Adds three columns to `events` and their version twins to `_events_v`: `location_coordinates_latitude` and `location_coordinates_longitude` (`numeric`, each with an index) and `location_coordinates_geocode_status` (`text`).

## What caused these changes

The event location's new `coordinates` group: latitude and longitude as two indexed number columns so the SQLite adapter can range-query them for the events map and nearest-first sort, plus a hidden status recording where the point came from (geocoded, approximate, placed by hand, or failed).

## Conclusion

Additive only. Existing rows get `NULL` coordinates and appear on the list but not the map until they are saved again (which geocodes them) or placed by hand. The `migrate:check` warnings are the six `ALTER TABLE ... ADD` statements, which drop nothing.
