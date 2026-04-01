/**
 * Zod schemas for NAC v2 forecast and warning API responses.
 * Ported from avy/types/nationalAvalancheCenter/schemas.ts
 */
import { z } from 'zod'

// ─── Enums ──────────────────────────────────────────────────────────────────

export enum DangerLevel {
  GeneralInformation = -1,
  None,
  Low,
  Moderate,
  Considerable,
  High,
  Extreme,
}

export enum ProductType {
  Forecast = 'forecast',
  Warning = 'warning',
  Watch = 'watch',
  Summary = 'summary',
  Special = 'special',
}

export enum ProductStatus {
  Published = 'published',
}

export enum ForecastPeriod {
  Current = 'current',
  Tomorrow = 'tomorrow',
}

export enum AvalancheProblemType {
  DryLoose = 1,
  StormSlab,
  WindSlab,
  PersistentSlab,
  DeepPersistentSlab,
  WetLoose,
  WetSlab,
  CorniceFall,
  Glide,
}

export enum AvalancheProblemName {
  DryLoose = 'Dry Loose',
  StormSlab = 'Storm Slab',
  WindSlab = 'Wind Slab',
  PersistentSlab = 'Persistent Slab',
  DeepPersistentSlab = 'Deep Persistent Slab',
  WetLoose = 'Wet Loose',
  WetSlab = 'Wet Slab',
  CorniceFall = 'Cornice Fall',
  Glide = 'Glide',
  GlideAvalanches = 'Glide Avalanches',
}

export enum AvalancheProblemLikelihood {
  Unlikely = 'unlikely',
  Possible = 'possible',
  Likely = 'likely',
  VeryLikely = 'very likely',
  AlmostCertain = 'almost certain',
  Certain = 'certain',
}

export enum AvalancheProblemLocation {
  NorthUpper = 'north upper',
  NortheastUpper = 'northeast upper',
  EastUpper = 'east upper',
  SoutheastUpper = 'southeast upper',
  SouthUpper = 'south upper',
  SouthwestUpper = 'southwest upper',
  WestUpper = 'west upper',
  NorthwestUpper = 'northwest upper',
  NorthMiddle = 'north middle',
  NortheastMiddle = 'northeast middle',
  EastMiddle = 'east middle',
  SoutheastMiddle = 'southeast middle',
  SouthMiddle = 'south middle',
  SouthwestMiddle = 'southwest middle',
  WestMiddle = 'west middle',
  NorthwestMiddle = 'northwest middle',
  NorthLower = 'north lower',
  NortheastLower = 'northeast lower',
  EastLower = 'east lower',
  SoutheastLower = 'southeast lower',
  SouthLower = 'south lower',
  SouthwestLower = 'southwest lower',
  WestLower = 'west lower',
  NorthwestLower = 'northwest lower',
}

export enum AvalancheProblemSize {
  Small = 1,
  Large,
  VeryLarge,
  Historic,
}

export enum MediaType {
  Image = 'image',
  Video = 'video',
  External = 'external',
  Photo = 'photo',
  PDF = 'pdf',
  Unknown = 'unknown',
  None = '',
}

export enum ExternalMediaType {
  Image = 'image',
  Video = 'video',
  Instagram = 'instagram',
}

// ─── Primitive schemas ──────────────────────────────────────────────────────

export const dangerLevelSchema = z.nativeEnum(DangerLevel)

export const avalancheProblemLocationSchema = z.nativeEnum(AvalancheProblemLocation)

// NWAC (and others) return strings for avalanche problem size, not numbers
export const avalancheProblemSizeSchema = z
  .number()
  .or(z.string())
  .transform((val: number | string, ctx) => {
    const parsed = typeof val === 'number' ? val : parseFloat(val)
    if (isNaN(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Avalanche problem size must be numeric, got: ${val}.`,
      })
      return z.NEVER
    }
    return parsed
  })

export const forecastPeriodSchema = z.nativeEnum(ForecastPeriod)

// ─── Media schemas ──────────────────────────────────────────────────────────

export const nullMediaSchema = z.object({
  type: z.null(),
  url: z.null(),
  caption: z.literal(''),
  title: z.literal(''),
})

export const emptyMediaSchema = z.object({
  type: z.literal(''),
  url: z.literal(''),
  caption: z.literal(''),
})

export const imageMediaSchema = z.object({
  id: z.number().or(z.string()).optional(),
  type: z.literal(MediaType.Image),
  url: z.object({
    large: z.string(),
    medium: z.string(),
    original: z.string(),
    thumbnail: z.string(),
  }),
  title: z.string().nullable().optional(),
  caption: z.string().nullable(),
})
export type ImageMediaItem = z.infer<typeof imageMediaSchema>

export const photoMediaSchema = imageMediaSchema.extend({
  type: z.literal(MediaType.Photo),
  url: z.string(),
})
export type PhotoMediaItem = z.infer<typeof photoMediaSchema>

export const videoMediaSchema = imageMediaSchema.extend({
  type: z.literal(MediaType.Video),
  url: z
    .object({
      external_link: z.string(),
      external_type: z.nativeEnum(ExternalMediaType),
    })
    .or(
      z.object({
        large: z.string(),
        medium: z.string(),
        original: z.string(),
        thumbnail: z.string(),
        video_id: z.string(),
      }),
    )
    .or(z.string()),
})
export type VideoMediaItem = z.infer<typeof videoMediaSchema>

export const externalMediaSchema = imageMediaSchema.extend({
  type: z.literal(MediaType.External),
  url: z.object({
    external_link: z.string(),
    external_type: z.nativeEnum(ExternalMediaType),
  }),
})
export type ExternalMediaItem = z.infer<typeof externalMediaSchema>

export const pdfMediaSchema = z.object({
  type: z.literal(MediaType.PDF),
  url: z.object({
    original: z.string().url(),
  }),
})

const unknownMediaSchema = z.object({
  type: z.literal(MediaType.Unknown),
})

export const mediaItemSchema = z
  .discriminatedUnion('type', [
    emptyMediaSchema,
    nullMediaSchema,
    imageMediaSchema,
    videoMediaSchema,
    externalMediaSchema,
    photoMediaSchema,
    pdfMediaSchema,
    unknownMediaSchema,
  ])
  .catch({
    type: MediaType.Unknown,
  })
export type MediaItem = z.infer<typeof mediaItemSchema>

// ─── Forecast sub-schemas ───────────────────────────────────────────────────

export const avalancheCenterMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  city: z.string().nullable(),
  state: z.string(),
})
export type AvalancheCenterMetadata = z.infer<typeof avalancheCenterMetadataSchema>

export const avalancheForecastZoneSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
  state: z.string(),
  zone_id: z.string(),
})
export type AvalancheForecastZoneSummary = z.infer<typeof avalancheForecastZoneSummarySchema>

export const avalancheDangerForecastSchema = z.object({
  lower: dangerLevelSchema.nullable().transform((v) => v ?? DangerLevel.None),
  middle: dangerLevelSchema.nullable().transform((v) => v ?? DangerLevel.None),
  upper: dangerLevelSchema.nullable().transform((v) => v ?? DangerLevel.None),
  valid_day: forecastPeriodSchema,
})
export type AvalancheDangerForecast = z.infer<typeof avalancheDangerForecastSchema>

export const avalancheProblemSchema = z.object({
  id: z.number(),
  forecast_id: z.number(),
  rank: z.number(),
  avalanche_problem_id: z.nativeEnum(AvalancheProblemType),
  name: z.nativeEnum(AvalancheProblemName),
  likelihood: z.nativeEnum(AvalancheProblemLikelihood),
  location: z.array(avalancheProblemLocationSchema),
  size: z.array(avalancheProblemSizeSchema),
  discussion: z.string().nullable(),
  problem_description: z.string(),
  icon: z.string(),
  media: mediaItemSchema,
})
export type AvalancheProblem = z.infer<typeof avalancheProblemSchema>

// ─── Forecast schemas ───────────────────────────────────────────────────────

export const forecastSchema = z.object({
  id: z.number(),
  product_type: z.literal(ProductType.Forecast),
  status: z.nativeEnum(ProductStatus),
  author: z.string().nullable(),
  published_time: z.string(),
  expires_time: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  announcement: z.string().optional().nullable(),
  bottom_line: z.string().nullable(),
  forecast_avalanche_problems: z.array(avalancheProblemSchema),
  hazard_discussion: z.string().nullable(),
  danger: z.array(avalancheDangerForecastSchema),
  danger_level_text: z.string().optional().nullable(),
  weather_discussion: z.string().optional().nullable(),
  weather_data: z
    .object({
      weather_product_id: z.number(),
    })
    .nullable(),
  media: z.array(mediaItemSchema).nullable(),
  avalanche_center: avalancheCenterMetadataSchema,
  forecast_zone: z.array(avalancheForecastZoneSummarySchema),
})
export type Forecast = z.infer<typeof forecastSchema>

export const summarySchema = forecastSchema
  .omit({
    danger: true,
    forecast_avalanche_problems: true,
  })
  .extend({
    product_type: z.literal(ProductType.Summary),
    expires_time: z.string().nullable(),
  })
export type Summary = z.infer<typeof summarySchema>

export const forecastResultSchema = z.discriminatedUnion('product_type', [
  forecastSchema,
  summarySchema,
])
export type ForecastResult = z.infer<typeof forecastResultSchema>

// ─── Warning schemas ────────────────────────────────────────────────────────

export const nullWarningSchema = z.object({
  avalanche_center: z.null(),
  published_time: z.null(),
  expires_time: z.null(),
  created_at: z.null(),
  updated_at: z.null(),
})
export type NullWarning = z.infer<typeof nullWarningSchema>

export const warningSchema = z.object({
  id: z.number(),
  product_type: z.literal(ProductType.Warning),
  published_time: z.string(),
  expires_time: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  reason: z.string(),
  affected_area: z.string(),
  bottom_line: z.string(),
  hazard_discussion: z.string(),
  avalanche_center: avalancheCenterMetadataSchema,
})
export type Warning = z.infer<typeof warningSchema>

export const watchSchema = warningSchema.extend({
  product_type: z.literal(ProductType.Watch),
})
export type Watch = z.infer<typeof watchSchema>

export const specialSchema = warningSchema.extend({
  product_type: z.literal(ProductType.Special),
})
export type Special = z.infer<typeof specialSchema>

export const warningResultSchema = nullWarningSchema.or(
  z.discriminatedUnion('product_type', [warningSchema, watchSchema, specialSchema]),
)
export type WarningResult = z.infer<typeof warningResultSchema>
