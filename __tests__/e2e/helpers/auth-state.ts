import path from 'path'
import { fileURLToPath } from 'url'
import type { UserRole } from '../fixtures/test-users'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const authDir = path.join(__dirname, '..', '.auth')

/** Get the path to a role's saved storage state file */
export function authFile(role: UserRole): string {
  return path.join(authDir, `${role}.json`)
}
