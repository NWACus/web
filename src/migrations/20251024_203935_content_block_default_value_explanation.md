## Actual changes in JSON snapshots

Adds a DEFAULT to the rich_text field on:

- home_pages_blocks_content_columns
- \_home_pages_v_blocks_content_columns
- pages_blocks_content_columns
- \_pages_v_blocks_content_columns

## What caused these changes

Adding a default value to the content block's lexical column field to workaround the following issue: https://github.com/payloadcms/payload/issues/14022

## Conclusion

This migration was generated with the table recreation pattern which can cause data loss due to libSQL's noop behavior for `PRAGMA foreign_keys={off|on};` inside of transactions. It was rewritten using a similar pattern but just for the rich_text column:

1. Create new column with default value
2. Copy values over from previous column using `COALESCE` to set NULL values to the default value
3. Deletes the old column
4. Renames the new column to the old columns name

This migration was run locally using the instructions in `docs/migration-safety.md` using `turso dev` to observe database changes after this migration.
