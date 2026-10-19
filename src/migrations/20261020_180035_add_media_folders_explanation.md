## Actual changes in JSON snapshots

Adds the `payload_folders` table (with `tenant_id`, `name`, a self-referencing `folder_id` for nesting, and `content_hash`) and its `payload_folders_folder_type` select table. Adds a nullable `folder_id` column to `media` and a `payload_folders_id` column to `payload_locked_documents_rels`.

## What caused these changes

Payload's folders are enabled on Media (`folders: true`), which generates the `payload-folders` collection and a `folder` relationship on Media. Our `collectionOverrides` add the required tenant relationship and the seed's `contentHash` to that collection.

## Conclusion

Additive only. Existing media keep `folder_id` null, which Payload shows at the root of the folder view. The `migrate:check` warnings are the `ON DELETE` clauses and the two `ALTER TABLE ... ADD` statements, which drop nothing. `migrate:create` omits `ON DELETE` on `ALTER ... REFERENCES`, so it was added by hand (`set null` on `media.folder_id`, `cascade` on the locked-documents rel) to match the schema push mode creates.
