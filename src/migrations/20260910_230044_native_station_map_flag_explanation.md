# 20260910_230044_native_station_map_flag

## What caused these changes

`nativeProducts` on the `settings` collection gained a fourth per-tenant rollout checkbox, `stationMap`, for the native weather station map (#1221). Payload generated one statement: `ALTER TABLE settings ADD native_products_station_map integer DEFAULT false`.

## Conclusion

Additive only. The column is added with a default of `false`, so every existing tenant keeps the legacy `stations` widget until an admin flips the flag; no rows are rewritten, no table is recreated, and `down` drops only the new column. The safety check flags the `ALTER` keyword generically, exactly as it did for the identical `native_products_danger_map` migration.
