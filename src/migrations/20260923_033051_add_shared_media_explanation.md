## Actual changes in JSON snapshots

Creates the `shared_media` table and its indexes, then adds two columns to each of the four Media block tables:

- `home_pages_blocks_media_block`
- `_home_pages_v_blocks_media_block`
- `pages_blocks_media_block`
- `_pages_v_blocks_media_block`

The added columns are `source` (`text DEFAULT 'center'`) and `shared_media_id` (`integer REFERENCES shared_media(id) ON DELETE set null`), each with an index on the new foreign key. `payload_locked_documents_rels` gains the matching `shared_media_id` relation column (`ON DELETE cascade`).

**The `ON DELETE` clauses were added by hand.** The generator drops them from `ALTER TABLE ... ADD ... REFERENCES`, which leaves SQLite's default `NO ACTION`, while the JSON snapshot and push-mode dev both say `set null`. Turso enforces foreign keys, so without the clause, deleting a shared photo that any page version ever used would fail in production and succeed in dev. Changing a foreign key's action after the fact means recreating the table, which is the `PRAGMA foreign_keys=OFF` pattern `docs/migration-safety.md` warns against, so it has to be right in this migration.

## What caused these changes

The `sharedMedia` collection (ADR 022, Shared Content) and the "Center library / Shared library" source choice on the Media block.

`shared_media` is created with `reference_count` already on it, even though the hooks that maintain that number arrive further up the stack. The whole stack ships together, so creating the table complete is better than creating it and immediately altering it.

## Conclusion

`up()` is additive only: one `CREATE TABLE`, `ADD COLUMN` statements, and `CREATE INDEX`. Nothing is dropped, no table is recreated, and there is no `PRAGMA foreign_keys=OFF` in `up()`, so the libSQL cascade-delete issue in `docs/migration-safety.md` does not apply.

`pnpm migrate:check` flags all nine `ALTER TABLE ... ADD` statements, because it warns on the `ALTER` keyword regardless of what follows it. All nine are `ADD COLUMN`. It also flags the five hand-added `ON DELETE` clauses, on the `DELETE` keyword; none of them deletes anything.

No backfill is needed. SQLite's `ADD COLUMN ... DEFAULT 'center'` gives existing rows `'center'` too. `resolveMediaSource` only reaches for the shared library when `source === 'shared'`, so a missing value also resolves to the center's own Media — including Media blocks stored as JSON inside Post rich text, which this migration does not touch at all.

`down()` uses the table-recreation pattern Payload generates for SQLite column drops. It carries the usual caveat for a rollback on Turso and was not exercised.
