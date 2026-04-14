## Actual changes in JSON snapshots

Three new sub-tables added:

- `biographies_document_references`
- `sponsors_document_references`
- `teams_document_references`

No existing tables or columns modified or dropped.

## What caused these changes

Added `documentReferencesField()` (a hidden array field) to the Sponsors, Biographies, and Teams collections. This field stores references to other documents (e.g., media images) so the recursive revalidation system can follow changes through intermediate (non-routable) collections.

## Conclusion

This migration is purely additive — it only creates new tables. The `ON DELETE cascade` foreign key clauses flagged by the safety check are standard Payload array sub-table behavior: when a parent sponsor/biography/team row is deleted, its `documentReferences` child rows are cleaned up. No existing data is affected.
