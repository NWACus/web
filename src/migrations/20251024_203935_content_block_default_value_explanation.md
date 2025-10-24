## Actual changes in JSON snapshots

Adds a DEFAULT to the rich_text field on:

- home_pages_blocks_content_columns
- \_home_pages_v_blocks_content_columns
- pages_blocks_content_columns
- \_pages_v_blocks_content_columns

## What caused these changes

Adding a default value to the content block's lexical column field to workaround the following issue: https://github.com/payloadcms/payload/issues/14022

## Conclusion

This migration was generated with the table recreation pattern which can cause data loss due to libSQL's noop behavior for `PRAGMA foreign_keys={off|on};` inside of transactions. Originally it had the use of `PRAGMA foreign_keys={off|on};` but I removed it because the tables being recreated only have parent foreign key relationships, no child foreign key relationships. So those tables can be deleted without any data loss because no tables have child foreign key relationships.

This migration was run locally using the instructions in `docs/migration-safety.md` using `turso dev` to observe database changes after this migration.
