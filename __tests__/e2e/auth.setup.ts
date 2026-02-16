import { test as setup } from '@playwright/test'
import { testUsers, type UserRole } from './fixtures/test-users'
import { performLogin } from './helpers'
import { authFile } from './helpers/auth-state'

// Run setup logins serially to avoid overwhelming the dev server,
// and with a longer timeout since each login involves form hydration.
setup.describe.configure({ mode: 'serial', timeout: 60000 })

for (const [role, user] of Object.entries(testUsers)) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    await performLogin(page, user.email, user.password)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    await page.context().storageState({ path: authFile(role as UserRole) })
  })
}
