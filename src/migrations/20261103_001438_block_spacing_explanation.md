## Actual changes in JSON snapshots

Adds `spacing_top` and `spacing_bottom` columns, `text DEFAULT 'sm'`, to the Page and Home Page block table of each of the 22 layout blocks, and to their `_v` version tables.

## What caused these changes

The new "Space above" and "Space below" selects (None, Small, Medium, Large) on every layout block. They set the whole gap between blocks, replacing each block's own margin. Both default to Small, which matches the margin a block without a color had before, so those pages look the same. Colored blocks used to have no outside margin and sat flush against each other; they now get Small too, so stacked colored blocks gain a 12px gap (20px from `md`). That's intended: a colored block can't be set to None. Blocks inside rich text hide the selects and the frontend applies spacing only to top-level layout blocks, so no Lexical JSON needs a backfill.

## Conclusion

Additive only. The `migrate:check` warnings are the 176 `ALTER TABLE ... ADD` statements, which drop nothing. `down` drops the same columns.
