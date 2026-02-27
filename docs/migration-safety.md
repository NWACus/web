# Migration Safety Checks

This document explains the automated checks in place to prevent data loss during database migrations.

## Background

Payload's `migrate:create` command generates migrations based on schema changes, but doesn't warn about potentially destructive commands.

### Known issue: foreign key cascade delete behavior differences
There is also a difference in behavior between Turso's libSQL servers and our local SQLite databases: Turso does not respect `PRAGMA FOREIGN_KEYS=off` statements inside of transactions. Payload/Drizzle uses this strategy to temporarily disable cascade deletes of foreign key relationships. Because this doesn't work on Turso servers (a libSQL behavior), this can result in data losss in `_rels` tables.

Background reading:
- [SQLite docs highlighting foreign_keys behavior in transactions](https://www.sqlite.org/foreignkeys.html#fk_enable:~:text=It%20is%20not%20possible%20to%20enable%20or%20disable%20foreign%20key%20constraints%20in%20the%20middle%20of%20a%20multi%2Dstatement%20transaction)
- https://github.com/tursodatabase/libsql-client-ts/issues/173
- https://github.com/ariga/atlas/issues/3317
- https://github.com/launchbadge/sqlx/issues/2085#issuecomment-1237474188

## Static Analysis Check

Runs on `git commit` via Husky pre-commit hook.

Runs in CI: PRs with new or modified migrations:
- The `migration-safety` CI job runs automatically
- If issues are detected, a comment is posted on the PR with details

Run locally:
```bash
# Check all migrations
pnpm migrate:check

# Check specific migration
pnpm migrate:check {migration file name}.ts
```

Potentially dangerous patterns it detects:
- `DROP TABLE` operations
- `PRAGMA foreign_keys=OFF` (an indicator that we may lose data in production due to the known issue mentioned above)
- Table recreation pattern (`__new_*`)
- `DROP COLUMN` operations
- `DELETE FROM` without WHERE clause
- `TRUNCATE TABLE` operations
- Column type changes
- Constraint drops

## Snapshot Consistency Check

Detects when a migration's JSON snapshot regresses changes from a prior snapshot. This typically happens when two PRs with migrations are developed in parallel — whichever merges second may have a snapshot that doesn't include the first PR's changes.

Runs on `git commit` via Husky pre-commit hook (when `.json` migration files are staged).

Runs in CI: PRs with new or modified migration snapshots.

Run locally:
```bash
pnpm migrate:check-snapshots
```

### How it works

The check compares the last 3 JSON snapshots (S(k-2), S(k-1), S(k)):
1. Computes what changed between S(k-2) and S(k-1) (columns/tables added or removed)
2. Checks if S(k) reverts any of those changes

Types of regressions detected:
- A column **added** in S(k-1) is missing from S(k)
- A column **removed** in S(k-1) reappears in S(k)
- A table **added** in S(k-1) is missing from S(k)
- A table **removed** in S(k-1) reappears in S(k)

### When a regression is detected

If the regression is **unintentional** (parallel PR problem):
1. Rebase your branch on top of `main` (which now contains the prior migration)
2. Delete your migration files (both `.ts` and `.json`)
3. Regenerate: `pnpm payload migrate:create`
4. Verify: `pnpm migrate:check-snapshots`

If the regression is **intentional** (e.g., reverting a change):
- The warning can be safely ignored

## Workflow

### Creating a new migration

1. Make schema changes in your Payload config
2. Run `pnpm payload migrate:create`
3. Review generated migration file
4. Recommended: Manually run `pnpm migrate:check <filename>` to preview warnings
5. Recommended: Manually run `pnpm migrate:diff` to diff the current JSON snapshot compared to the previous JSON snapshot to see what actually changed
6. Commit changes (pre-commit hook runs checks automatically)
7. If warnings appear in the pre-commit check:
   - Review the migration for potential data loss
   - Manually modify migration to ensure it runs without unintentional data loss
   - Use `git commit --no-verify` if you're certain it's safe
8. Recommended: Test the migration locally using the instructions below

### Testing a migration locally

To manually test the effects of a migration locally, follow these steps:

1. Use a local Turso libSQL server to test migrations to mimic the different behavior of Turso in production: `turso dev`
2. Set this url `http://127.0.0.1:8080` as the `DATABASE_URI` in your `.env`
3. Make sure `ENABLE_LOCAL_MIGRATIONS=true` is set in `.env`
4. If you have already created the migration that you want to test, you must first comment it out from the list of migrations in `/src/migrations/index.ts` **and** move the files outside of the `/src/migrations` directory. Payload will still run migration files in `/src/migrations` even if they're not listed in `/src/migrations/index.ts`.
5. Run migrations prior to the migration you're testing: `pnpm migrate`
6. Seed the db: `pnpm seed:standalone`
7. Run `pnpm dev` and inspect any data you want to make sure persists through the migration to verify it's been created correctly.
8. Move the migration(s) you're testing back into `/src/migrations` and back into the list of migrations in `/src/migrations/index.ts`
9. Run the migration(s) you're testing by running: `pnpm migrate`
10. Inspect the data you expected to persist to ensure the migration has not resulted in data loss.

## Writing Custom Migrations to Replace Unsafe Auto-Generated Ones

Sometimes Payload/Drizzle generates migrations that would cause data loss in production due to the `PRAGMA foreign_keys=OFF` issue (see above for details). In these cases, you have two options:

### Options for avoiding data loss from unsafe auto-generated migrations

#### 1 - Preferred: Write a custom migration

1. Manually simplify the migration to avoid the unsafe patterns
2. Preserve the JSON schema snapshot so Payload's diffing logic recognizes the schema is in sync

#### 2 - Keep old fields, marked as hidden

If you can't write a custom migration that

### Understanding Payload's Migration System

Payload uses Drizzle under the hood, which tracks the database schema state using JSON snapshot files:
- Each migration has **two files**: `{timestamp}_{name}.ts` and `{timestamp}_{name}.json`
- The **TypeScript file** contains the migration SQL commands
- The **JSON file** is a snapshot of the **expected schema state after the migration runs**
- When you run `pnpm payload migrate:create`, Drizzle compares your Payload config against the **latest JSON snapshot** to detect changes

### Write your own migration

#### Step 1: Analyze what actually needs to change

Look at the auto-generated migration and identify the **actual schema change**. Often, a massive migration is just Drizzle's way of making a small change.

We have two options for analyzing what actually changed:

**1 - Custom script**

`pnpm migrate:diff`

Will compare the current JSON snapshot with the previous JSON snapshot and show you:
- Tables added
- Tables removed
- Tables modified + fields added/removed

**2 - Diffing the actual files**

One liner (compares the two most recent migrations): `diff -u --color=always $(ls -t src/migrations/*.json | sed -n '2p') $(ls -t src/migrations/*.json | sed -n '1p')`

One liner for saving to a file (no `--color` flag): `diff -u $(ls -t src/migrations/*.json | sed -n '2p') $(ls -t src/migrations/*.json | sed -n '1p') > migration.diff`

#### Step 2: Write a minimal, safe migration

Replace the auto-generated migration using `await db.run()` sql statements or using the Payload Local API.

**Key principles:**
- Avoid `PRAGMA foreign_keys=OFF` completely
- Avoid table recreation (`CREATE TABLE __new_*`, `DROP TABLE`, `ALTER TABLE RENAME`)
- Add clear comments explaining why you simplified it

#### Step 3: Preserve the JSON schema snapshot

**Critical:** Don't delete the JSON file! You need to keep it so Payload knows what the schema should look like after the migration.

If you already deleted it or want to regenerate it:

```bash
# Generate a new migration to get the correct JSON snapshot
pnpm payload migrate:create temp_for_json

# Move the JSON file to your migration and delete the temp TS file
mv src/migrations/{temp_timestamp}_temp_for_json.json src/migrations/{your_migration_timestamp}.json
rm src/migrations/{temp_timestamp}_temp_for_json.ts
```

The JSON file represents the **target schema state** that Payload expects after running your migration.

#### Step 4: Verify the schema is in sync

Test that Payload's diffing logic recognizes your custom migration as correct:

```bash
pnpm payload migrate:create test_check
```

You should see: **"No schema changes detected. Would you like to create a blank migration file?"**

If Payload tries to generate another migration, it means your JSON snapshot doesn't match what Payload expects. You may need to regenerate the JSON file (Step 3).

#### Step 5: Test the migration

Follow the "Testing a migration locally" workflow above using a local Turso server to ensure:
- The migration runs without errors
- No data is lost
- The schema state matches expectations

### When you can't write your own migration avoiding the table recreation pattern

If the migration genuinely needs to modify table structures in ways that require `PRAGMA foreign_keys=OFF`:

Keep the old schema and mark fields as `hidden: true` (see "The fix: keep old attributes" above)

## Relevant files
- Pre-commit Hook: `.husky/check-migrations`
- CI Job: `.github/workflows/ci.yaml` (migration-safety job)
- Migration check script: `src/scripts/check-migrations.ts`
- Migration diff script: `src/scripts/analyze-migration-diff.ts`
- Snapshot consistency script: `src/scripts/check-snapshot-consistency.ts`
