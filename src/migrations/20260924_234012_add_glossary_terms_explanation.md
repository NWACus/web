## Actual changes in JSON snapshots

Creates the `glossary_terms` table (with a unique index on `term`) and `glossary_terms_texts`, the table Payload keeps a `hasMany` text field's values in (here, `aliases`). `payload_locked_documents_rels` gains the matching `glossary_terms_id` relation column (`ON DELETE cascade`).

**The `ON DELETE cascade` on that column was added by hand.** The generator drops it from `ALTER TABLE ... ADD ... REFERENCES`, which leaves SQLite's default `NO ACTION`, while the JSON snapshot and push-mode dev both say `cascade`. Turso enforces foreign keys, so without the clause, deleting a glossary term an editor had open would fail in production and succeed in dev. Changing a foreign key's action after the fact means recreating the table, so it has to be right here.

## What caused these changes

The `glossaryTerms` Shared Content collection (ADR 018, ADR 022), the national term list behind the native forecast glossary tooltips. The 82 legacy terms are loaded by the next migration, `20260924_234036_seed_glossary_terms`, kept separate so the schema and the data can be reasoned about (and regenerated) independently.

## Conclusion

`up()` is additive only: two `CREATE TABLE`s, one `ADD COLUMN`, and `CREATE INDEX`. Nothing is dropped, no table is recreated, and there is no `PRAGMA foreign_keys=OFF` in `up()`, so the libSQL cascade-delete issue in `docs/migration-safety.md` does not apply.

`pnpm migrate:check` flags the `ALTER TABLE ... ADD` statement, because it warns on the `ALTER` keyword regardless of what follows it, and the two `ON DELETE cascade` clauses on the `DELETE` keyword. None of them deletes anything.

`down()` uses the table-recreation pattern Payload generates for SQLite column drops. It carries the usual caveat for a rollback on Turso and was not exercised.
