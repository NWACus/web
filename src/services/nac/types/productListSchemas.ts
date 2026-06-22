/**
 * Zod schema for the NAC v2 product *list* endpoint
 * (`GET /v2/public/products?avalanche_center_id={CENTER}`).
 *
 * This is the lightweight archive index — one entry per published product. It is
 * intentionally narrower than the full by-id product schema in `forecastSchemas`:
 * we only keep the fields needed to build a zone's date list (id, type, published
 * time, and which zones the product covers). The endpoint ignores all narrowing
 * params and always returns the center's full archive (~9.6k items for NWAC), so
 * unknown fields are tolerated and only the columns we use are validated.
 */
import { z } from 'zod'

export const productListItemSchema = z
  .object({
    id: z.number(),
    product_type: z.string(),
    published_time: z.string(),
    // Top-level overall danger rating (0-5; -1 = general info). Used to color the date picker.
    danger_rating: z.number().nullable().optional(),
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
export type ProductListItem = z.infer<typeof productListItemSchema>

export const productListSchema = z.array(productListItemSchema)
