## Actual changes in JSON snapshots

Adds a `display_as` column, `text DEFAULT 'download'`, to `pages_blocks_document_block`, `home_pages_blocks_document_block` and their `_v` version tables.

## What caused these changes

The Document block's new "Display as" select (Download Link or Embed), part of #836. New blocks default to Download Link.

## Data backfill

Before this change every Document block rendered as an iframe, so the migration sets `display_as = 'embed'` on every existing row, including version rows, whose document is a PDF, so published pages look the same after deploy. A blanket `download` backfill would have turned NWAC's Terms of Use and Privacy Policy, among others, into download buttons.

Blocks pointing at any other type (the old allow list let in KML, XML and `application/octet-stream`) keep the `download` default. `validateDisplayAs` rejects `embed` for non-PDFs, so backfilling them to `embed` would have left those pages rendering but impossible for editors to save. Those files are now served as attachments, so an iframe of them would only trigger a download anyway.

Document blocks inside rich text are stored in the Lexical JSON, not in these tables. The migration walks every rich-text column whose editor offers the block (Content block columns, Home Page highlighted content, Posts, Events, and their versions) and gives any Document block with no value `displayAs: "embed"` if its document is a PDF and `displayAs: "download"` otherwise. Production had one such block when this was written, on MSAC's Annual Reports page.

## Conclusion

Additive only. The `migrate:check` warnings are the four `ALTER TABLE ... ADD` statements, which drop nothing. `down` drops the column and leaves the added `displayAs` keys in rich-text JSON, which Payload ignores without the field.
