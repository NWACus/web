/**
 * Zod schema for the NAC v2 product *list* endpoint
 * (`GET /v2/public/products?avalanche_center_id={CENTER}`).
 *
 * This is the lightweight archive index — one entry per published product. It is
 * intentionally narrower than the full by-id product schema in `forecastSchemas`:
 * we only keep the fields needed to build a zone's date list and the archive
 * browser's rows (id, type, published time, danger, author, which zones the
 * product covers). The endpoint honors `date_start`/`date_end` but ignores every
 * other narrowing param, so unknown fields are tolerated and only the columns we
 * use are validated.
 */
import { z } from 'zod'

export const productListItemSchema = z
  .object({
    id: z.number(),
    product_type: z.string(),
    published_time: z.string(),
    // Top-level overall danger rating (0-5; -1 = general info). Used to color the date picker.
    danger_rating: z.number().nullable().optional(),
    author: z.string().nullable().optional(),
    // Null on the ~1,200 NWAC forecasts bulk-imported from the pre-AFP system (2019–2020), which
    // the legacy archive browser hides. Kept so the native browser can apply the same rule.
    updated_at: z.string().nullable().optional(),
    forecast_zone: z.array(
      z
        .object({
          id: z.number(),
          name: z.string(),
        })
        // Tolerate the other zone fields (url, zone_id, config) without validating them.
        .passthrough(),
    ),
  })
  // Tolerate the many archive columns we don't consume (danger, bottom_line, ...).
  .passthrough()
export const productListSchema = z.array(productListItemSchema)
