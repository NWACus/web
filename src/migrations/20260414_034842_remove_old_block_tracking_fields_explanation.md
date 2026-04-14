## Actual changes in JSON snapshots

Drops 6 tables (3 tracking tables + their version tables):

- `posts_blocks_in_content` / `_posts_v_version_blocks_in_content`
- `events_blocks_in_content` / `_events_v_version_blocks_in_content`
- `home_pages_blocks_in_highlighted_content` / `_home_pages_v_version_blocks_in_highlighted_content`

## What caused these changes

The old block-tracking system used per-collection array fields (`blocksInContent` on Posts/Events, `blocksInHighlightedContent` on HomePages) to track which blocks were embedded in Lexical rich text content. These fields were populated by `beforeChange` hooks (`populateBlocksInContent`, `populateBlocksInHighlightedContent`) that walked the Lexical AST at save time.

This system has been fully replaced by the unified `documentReferences` JSON field and `populateDocumentReferences` hook, which automatically discovers all relationship, upload, and block references across any collection's fields using the Payload collection config. The unified system was introduced across commits `6b7ace80` through `6b2ee8d2` on the `unified-revalidation` branch.

The old tracking fields, their population hooks, and their query utilities (`findDocumentsWithBlockReferences`, `findDocumentsWithRelationshipReferences`, `getBlocksFromConfig`, `getRelationshipsFromConfig`, `extractBlockReferencesFromLexical`, `revalidateBlockReferences`, `revalidateRelationshipReferences`) have all been removed.

## Conclusion

The data in these tables is safe to drop. It was only used for cache revalidation lookups (finding which documents reference a changed document). The same data is now stored in the `documentReferences` JSON field, which was backfilled in the prior migration (`20260414_030934_backfill_document_references`). No user-facing content is lost.
