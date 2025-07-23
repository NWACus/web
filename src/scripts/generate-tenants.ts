#!/usr/bin/env tsx

import configPromise from '@payload-config'
import { configDotenv } from 'dotenv'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getPayload } from 'payload'

// Load environment variables
configDotenv()

interface Tenant {
  id: number
  name: string
  slug: string
  customDomain?: string | null
}

async function fetchTenantsFromPayload(): Promise<Pick<Tenant, 'id' | 'slug' | 'customDomain'>[]> {
  try {
    console.log('Fetching tenants using Payload local API')

    // Use Payload's local API to bypass access control during build
    const payload = await getPayload({ config: configPromise })

    const tenantsRes = await payload.find({
      collection: 'tenants',
      limit: 1000,
      pagination: false,
      select: {
        id: true,
        slug: true,
        customDomain: true,
      },
      // Use overrideAccess to bypass collection access control during build
      overrideAccess: true,
    })

    const tenants = tenantsRes.docs.map((tenant) => ({
      id: tenant.id,
      slug: tenant.slug,
      customDomain: tenant.customDomain || null,
    }))

    console.log(`Successfully fetched ${tenants.length} tenants`)
    return tenants
  } catch (error) {
    console.warn('Failed to fetch tenants using Payload API, using fallback data:', error)

    // Fallback to hardcoded tenants if Payload is not available during build
    return [
      { id: 1, slug: 'nwac', customDomain: 'nwac.us' },
      { id: 2, slug: 'sac', customDomain: 'sierraavalanchecenter.org' },
      { id: 3, slug: 'snfac', customDomain: 'sawtoothavalanche.com' },
    ]
  }
}

async function generateTenants() {
  const tenants = await fetchTenantsFromPayload()

  // Ensure the generated directory exists
  const generatedDir = join(process.cwd(), 'src/generated')
  try {
    mkdirSync(generatedDir, { recursive: true })
  } catch {
    // Directory might already exist, that's fine
  }

  // Generate TypeScript file with tenant data
  const tenantData = `// Auto-generated at build time - DO NOT EDIT MANUALLY
// Generated on: ${new Date().toISOString()}

export const BUILD_TIME_TENANTS = ${JSON.stringify(tenants, null, 2)} as const

export type GeneratedTenant = (typeof BUILD_TIME_TENANTS)[number]
`

  const outputPath = join(generatedDir, 'tenants.ts')
  writeFileSync(outputPath, tenantData)

  console.log(`Generated ${tenants.length} tenants to ${outputPath}`)
  console.log(
    'Tenants:',
    tenants.map((t) => `${t.slug} (${t.customDomain || 'subdomain-only'})`).join(', '),
  )
}

// Run the generation
generateTenants().catch((error) => {
  console.error('Failed to generate tenants:', error)
  process.exit(1)
})
