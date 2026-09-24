# 20260924_221427_native_products_flags

## What caused these changes

`nativeProducts` on the `settings` collection holds the per-tenant rollout checkboxes for the native product pages: `forecast`, `warning`, `dangerMap`, `weather`, and `stationMap` (#1221). This migration was recreated on top of main's `20260923_033051_add_shared_media` so its snapshot includes main's schema; it folds the branch's earlier `native_products_flags` and `native_station_map_flag` migrations into one. Payload generated five statements of the form `ALTER TABLE settings ADD native_products_<flag> integer DEFAULT false`.

## Conclusion

Additive only. Each column is added with a default of `false`, so every existing tenant keeps the legacy widgets until an admin flips a flag; no rows are rewritten, no table is recreated, and `down` drops only the new columns. The safety check flags the `ALTER` keyword generically.
