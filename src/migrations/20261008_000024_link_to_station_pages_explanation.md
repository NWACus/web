## Actual changes in JSON snapshots

Adds a `station_pages_id` column (`integer REFERENCES station_pages(id) ON DELETE cascade`) and its index to every rels table that backs a `linkField` reference:

- `home_pages_rels`, `_home_pages_v_rels`
- `pages_rels`, `_pages_v_rels`
- `navigations_rels`, `_navigations_v_rels`
- `redirects_rels`

**The `ON DELETE cascade` clauses were added by hand.** The generator drops them from `ALTER TABLE ... ADD ... REFERENCES`, but the JSON snapshot says `cascade`, matching the sibling `pages_id`/`built_in_pages_id`/`posts_id` columns. Without it, Turso would refuse to delete a station page that any link points at.

## What caused these changes

`stationPages` joined `LINK_ENABLED_COLLECTIONS`, which `linkField`'s polymorphic `reference` relationship now uses, so buttons, nav items, quick links and redirects can point at a station page. Rich-text links store their target in the Lexical JSON and need no schema change.

## Conclusion

`up()` is additive only: `ADD COLUMN` and `CREATE INDEX`. Nothing is dropped or recreated and there is no `PRAGMA foreign_keys=OFF`, so the libSQL cascade-delete issue in `docs/migration-safety.md` does not apply. No backfill is needed; existing rows get `NULL`.

`pnpm migrate:check` flags all seven `ALTER TABLE ... ADD` statements on the `ALTER` keyword alone.

`down()` uses the table-recreation pattern Payload generates for SQLite column drops, with the usual caveat for a rollback on Turso, and was not exercised.
