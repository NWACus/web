import { z } from 'zod'

export const avalancheCenterPlatformsSchema = z.object({
  warnings: z.boolean(),
  forecasts: z.boolean(),
  stations: z.boolean(),
  obs: z.boolean(),
  weather: z.boolean()
})
export type AvalancheCenterPlatforms = z.infer<typeof avalancheCenterPlatformsSchema>

export const avalancheCenterCapabilitiesSchema = z.object({
  id: z.string(),
  platforms: avalancheCenterPlatformsSchema
})
export type AvalancheCenterCapabilities = z.infer<typeof avalancheCenterCapabilitiesSchema>

export const allAvalancheCenterCapabilitiesSchema = z.object({
  centers: z.array(avalancheCenterCapabilitiesSchema)
})
export type AllAvalancheCenterCapabilities = z.infer<typeof allAvalancheCenterCapabilitiesSchema>
