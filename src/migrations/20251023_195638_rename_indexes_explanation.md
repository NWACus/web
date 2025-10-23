## Actual changes in JSON snapshots

1. Index Renames (already handled correctly)

- roles_texts_order_parent_idx → roles_texts_order_parent
- global_roles_texts_order_parent_idx → global_roles_texts_order_parent

2. Foreign Key Renames (currently missing!)

The diff shows that 12 foreign keys are being renamed from _\_parent_fk to _\_parent_1_idx:

1. home_pages_rels_parent_fk → home_pages_rels_parent_1_idx
2. \_home_pages_v_rels_parent_fk → \_home_pages_v_rels_parent_1_idx
3. pages_rels_parent_fk → pages_rels_parent_1_idx
4. \_pages_v_rels_parent_fk → \_pages_v_rels_parent_1_idx
5. posts_rels_parent_fk → posts_rels_parent_1_idx
6. \_posts_v_rels_parent_fk → \_posts_v_rels_parent_1_idx
7. teams_rels_parent_fk → teams_rels_parent_1_idx
8. navigations_rels_parent_fk → navigations_rels_parent_1_idx
9. \_navigations_v_rels_parent_fk → \_navigations_v_rels_parent_1_idx
10. settings_rels_parent_fk → settings_rels_parent_1_idx
11. redirects_rels_parent_fk → redirects_rels_parent_1_idx
12. payload_locked_documents_rels_parent_fk → payload_locked_documents_rels_parent_1_idx
13. payload_preferences_rels_parent_fk → payload_preferences_rels_parent_1_idx

## What caused these changes

The Root Cause

Commit: a63b4d9f4c - "fix(db-postgres): limit index and foreign key names length (#14236)"
Date: October 17, 2025
In Version: 3.61.0

What Changed

Payload added two new utilities to prevent PostgreSQL identifier length limit errors:

1. buildIndexName() - Now has an appendSuffix parameter
2. buildForeignKeyName() - New utility for foreign key names

The Specific Changes

1. Index Names - \_idx suffix now optional

For the \*\_texts tables (like roles_texts, global_roles_texts), Payload changed from:
// OLD (before 3.61.0)
name: `${textsTableName}_order_parent_idx`

// NEW (3.61.0+)
name: buildIndexName({
name: `${textsTableName}_order_parent`,
adapter,
appendSuffix: false, // <-- This removes the \_idx suffix
})

Result: roles_texts_order_parent_idx → roles_texts_order_parent

2. Foreign Key Names - \_fk → \_1_fk pattern for relationships

For relationship tables (\*\_rels), the naming changed from:
// OLD
name: `${tableName}_parent_fk`

// NEW
name: buildForeignKeyName({
name: `${tableName}_parent`,
adapter
})

The buildForeignKeyName() function adds collision detection - if a name already exists, it appends \_1, \_2, etc. Since relationship tables share similar naming patterns, they get numbered: home_pages_rels_parent_1_fk.

But in SQLite these foreign key "names" are just metadata in Payload's schema JSON - SQLite doesn't actually use named foreign key constraints that can be referenced later, so no actual database migration is needed for the foreign key renames.

Conclusion

The migration at src/migrations/20251023_195638_rename_indexes.ts:14-40 only needs to handle the actual index
renames. The foreign key name changes in the JSON schema are just Payload's internal bookkeeping and don't require database alterations for SQLite.
