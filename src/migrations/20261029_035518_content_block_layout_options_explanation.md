## Actual changes in JSON snapshots

Adds a `vertical_alignment` column, `text DEFAULT 'top'`, to `pages_blocks_content`, `home_pages_blocks_content` and their `_v` version tables.

Adds `spacing_top` and `spacing_bottom` columns, `text DEFAULT 'none'`, to the Page and Home Page block table of each of the 22 layout blocks, and to their `_v` version tables.

## What caused these changes

The Content block's new "Vertical alignment" select (Top, Middle, Bottom, Stretch). It defaults to Top. Before this, columns stretched to the row's height but had no visible fill, so Top looks the same as existing pages.

The new "Extra space above" and "Extra space below" selects (None, Small, Medium, Large) on every layout block. Both default to None, which adds no space, so existing pages look the same. Blocks inside rich text hide the selects and the frontend applies spacing only to top-level layout blocks, so no Lexical JSON needs a backfill.

## Data backfill

The stored `layout` digits read opposite to what rendered: `2_12` rendered as a wide left column (2:1), and `3_112` as 2:1:1. The admin labels now describe the rendered widths, so the migration swaps `2_12` ↔ `2_21` and `3_112` ↔ `3_211` in all four tables, including version rows. The frontend's width classes swap keys to match, so no page changes how it looks after deploy. Content blocks only appear in Page and Home Page layouts, never in rich text, so there's no Lexical JSON to walk.

## Conclusion

Additive only. The `migrate:check` warnings are the 180 `ALTER TABLE ... ADD` statements, which drop nothing. The swap is its own inverse, so `down` runs it again before dropping the columns.
