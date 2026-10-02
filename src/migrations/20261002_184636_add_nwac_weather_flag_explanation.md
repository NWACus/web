# 20261002_184636_add_nwac_weather_flag

## What caused these changes

`nativeProducts.nwacWeather` is a new rollout checkbox on the `settings` collection. It turns on NWAC's own Mountain Weather Forecast page (#1347), which is a different product from the NAC weather product the existing `weather` flag covers. Payload generated one statement: `ALTER TABLE settings ADD native_products_nwac_weather integer DEFAULT false`.

## Conclusion

Additive only. The column is added with a default of `false`, so the page stays off for every tenant, NWAC included, until an admin ticks the box; no rows are rewritten, no table is recreated, and `down` drops only the new column. The safety check flags the `ALTER` keyword generically.
