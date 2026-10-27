# 20261026_195050_native_observations_flag

## What caused these changes

`nativeProducts` on the `settings` collection gained a sixth per-tenant rollout checkbox, `observations`, for the native public observation viewer (#1337). Payload generated one statement: `ALTER TABLE settings ADD native_products_observations integer DEFAULT false`.

## Conclusion

Additive only. The column is added with a default of `false`, so every existing tenant keeps the legacy `observations` widget until an admin flips the flag; no rows are rewritten, no table is recreated, and `down` drops only the new column. The safety check flags the `ALTER` keyword generically, exactly as it did for the identical `native_products_station_map` migration.
