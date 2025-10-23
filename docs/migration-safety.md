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

## Automated Checks

### Static Analysis

**What it does:** Scans migration files for dangerous patterns.

**When it runs:**
- Automatically on `git commit` via Husky pre-commit hook
- In CI when migrations are added or modified in pull requests

**Manual usage:**
```bash
# Check all migrations
pnpm migrate:check

# Check specific migration
pnpm migrate:check {migration file name}.ts
```

**Potentially dangerous patterns it detects:**
- `DROP TABLE` operations
- `PRAGMA foreign_keys=OFF` (an indicator that we may lose data in production due to the known issue mentioned above)
- Table recreation pattern (`__new_*`)
- `DROP COLUMN` operations
- `DELETE FROM` without WHERE clause
- `TRUNCATE TABLE` operations
- Column type changes
- Constraint drops

## Workflow

### Creating a new migration

1. Make schema changes in your Payload config
2. Run `pnpm payload migrate:create`
3. Review generated migration file
4. **Optional:** Manually run `pnpm migrate:check <filename>` to preview warnings
5. Commit changes (pre-commit hook runs checks automatically)
6. If warnings appear in the pre-commit check:
   - Review the migration for potential data loss
   - Manually modify migration to ensure it runs without unintentional data loss
   - Use `git commit --no-verify` if you're certain it's safe
7. **Recommended** Test the migration locally using the instructions below

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

### CI Integration

When you create a pull request with new or modified migrations:
- The `migration-safety` CI job runs automatically
- If issues are detected, a comment is posted on the PR with details
- Review the warnings and update the migration if needed

## Bypassing Checks

If you're certain a migration is safe despite warnings:

```bash
# Commit without pre-commit hook
git commit --no-verify
```

**⚠️ Use with caution & make sure other checks have passed**

## Fixing migrations with PRAGMA foreign_keys=OFF

When Payload/Drizzle generates migrations that recreate tables (the `__new_*` pattern), they use `PRAGMA foreign_keys=OFF` to prevent cascade deletes. However, **Turso does not respect this pragma inside transactions**, which means relationship tables (like `*_rels`) will still have their data cascade-deleted when the original table is dropped.

### The fix: keep old attributes + mark as disabled/hidden and make a note in the code

Unfortunately, several solutions we tried still result in data loss due to the foreign key behavior in libSQL. We tried:
- Using `defer_foreign_keys` instead of `foreign_keys` to temporarily disable the cascade delete behavior
- Using backup tables (same foreign key cascade delete issue)
- Temporarily disabling the cascade delete behavior (complex and still resulted in data loss when using a backup table strategy)

The simplest solution here is to keep fields that we want to remove and avoid migrations that use the create new, drop, rename strategy that causes data loss in foreign key relations due to libSQL's inability to disable foreign key constraints inside of a transaction. We can mark these fields as `hidden: true` in our Payload collection configs and leave a code comment explaining that they are deprecated.

This avoids needing the migration at all. It would be ideal to remove the data since we would be making the decision that we don't need it anymore but it is an acceptable trade off.

## Known issues

## Implementation Details

**Pre-commit Hook:** `.husky/check-migrations`
- Runs on new/modified migration files only
- Uses `git diff --cached` to detect staged migration files
- Runs `pnpm migrate:check` on each detected migration

**CI Job:** `.github/workflows/ci.yaml` (migration-safety job)
- Runs on all pull requests
- Compares branch against base to find new/modified migrations
- Posts GitHub comment with findings if issues detected

**Check Script:** `src/scripts/check-migrations.ts`
- Pattern-based analysis of migration file contents
- Focuses only on the `up` function to avoid false positives
- Outputs GitHub-formatted comments when run in CI
