import { existsSync } from 'fs'
import { join } from 'path'

// Check if static-tenants.ts already exists
const generatedDir = join(process.cwd(), 'src/generated')
const staticTenantsPath = join(generatedDir, 'static-tenants.ts')

if (existsSync(staticTenantsPath)) {
  console.log('Static tenants file already exists, skipping generation')
  process.exit(0)
} else {
  console.log('Static tenants file not found, running generation...')
  // Import and run the generation script
  import('./generate-static-tenants')
}
