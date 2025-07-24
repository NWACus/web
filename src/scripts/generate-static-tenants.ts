import configPromise from '@payload-config'
import { configDotenv } from 'dotenv'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getPayload } from 'payload'
import { FALLBACK_TENANTS } from './fallback-tenants'

configDotenv()

interface Tenant {
  id: number
  name: string
  slug: string
  customDomain?: string | null
}

async function fetchTenantsFromDatabase(): Promise<Pick<Tenant, 'id' | 'slug' | 'customDomain'>[]> {
  try {
    console.log('Fetching tenants from database using Payload API')

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
    })

    const tenants = tenantsRes.docs.map((tenant) => ({
      id: tenant.id,
      slug: tenant.slug,
      customDomain: tenant.customDomain || null,
    }))

    console.log(`Successfully fetched ${tenants.length} tenants from database`)
    return tenants
  } catch (error) {
    console.warn('Failed to fetch tenants from database:', (error as Error)?.message || error)
    return []
  }
}

async function generateStaticTenants() {
  console.log('Starting static tenant generation...')

  // Try to fetch fresh data from database
  const freshTenants = await fetchTenantsFromDatabase()

  // Determine best data source: fresh > existing > fallback
  let tenants: Pick<Tenant, 'id' | 'slug' | 'customDomain'>[]
  let dataSource: string

  if (freshTenants.length > 0) {
    tenants = freshTenants
    dataSource = 'database'
  } else {
    tenants = [...FALLBACK_TENANTS]
    dataSource = 'hardcoded fallback'
  }

  console.log(`Using tenant data from: ${dataSource}`)

  // Ensure the generated directory exists
  const generatedDir = join(process.cwd(), 'src/generated/tenants')
  try {
    mkdirSync(generatedDir, { recursive: true })
  } catch (error) {
    console.error('Error creating src/generated directory:', error)
    process.exit(1)
  }

  // Generate JSON file with static tenant data
  const jsonOutputPath = join(generatedDir, 'static-tenants.json')
  writeFileSync(jsonOutputPath, JSON.stringify(tenants, null, 2))

  console.log(`Generated ${tenants.length} tenants to ${jsonOutputPath}`)
  console.log(
    'Tenants:',
    tenants.map((t) => `${t.slug} (${t.customDomain || 'subdomain-only'})`).join(', '),
  )
}

generateStaticTenants()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to generate static tenants:', error)
    process.exit(1)
  })
