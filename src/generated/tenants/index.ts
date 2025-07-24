import { FALLBACK_TENANTS } from '@/scripts/fallback-tenants'
import { readFileSync } from 'fs'
import { join } from 'path'

export type StaticTenant = { id: number; slug: string; customDomain: string | null }

let STATIC_TENANTS: StaticTenant[]

try {
  // Try to read the generated JSON file
  const jsonPath = join(__dirname, 'static-tenants.json')
  const jsonContent = readFileSync(jsonPath, 'utf-8')

  // Check if jsonContent is empty or just whitespace
  if (!jsonContent || !jsonContent.trim()) {
    throw new Error('JSON file is empty')
  }

  const parsedContent = JSON.parse(jsonContent)

  // Validate that parsed content is an array
  if (!Array.isArray(parsedContent)) {
    throw new Error('JSON content is not an array')
  }

  // Check if array is empty
  if (parsedContent.length === 0) {
    throw new Error('JSON array is empty')
  }

  STATIC_TENANTS = parsedContent as StaticTenant[]
} catch {
  // Fall back to seed data if JSON file doesn't exist, is invalid, or is empty
  STATIC_TENANTS = [...FALLBACK_TENANTS]
}

export { STATIC_TENANTS }
