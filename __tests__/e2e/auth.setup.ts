import { test as setup } from '@playwright/test'
import { testUsers, type UserRole } from './fixtures/test-users'
import { performLogin } from './helpers'
import { authFile } from './helpers/auth-state'

// Run setup logins serially to avoid overwhelming the dev server, and with a
// timeout large enough to cover performLogin's full retry budget. Each attempt
// waits up to ~47s (15s form + 30s nav-hydrated + 2s pause) and it retries up
// to 3 times, so the per-login timeout must exceed that to let retries finish
// rather than aborting mid-retry under a slow (e.g. containerized) CI runner.
setup.describe.configure({ mode: 'serial', timeout: 180000 })

for (const [role, user] of Object.entries(testUsers)) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    await performLogin(page, user.email, user.password)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    await page.context().storageState({ path: authFile(role as UserRole) })
  })
}
