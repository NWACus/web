import { test as setup } from '@playwright/test'
import { testUsers, userRoles } from './fixtures/test-users'
import { authFile } from './helpers/auth-state'

// Authenticate via the REST login endpoint rather than driving the login form.
// It sets the same `payload-token` cookie the UI flow does, but skips form
// hydration (the main source of setup flakiness) and route compilation, so it's
// far faster and more reliable. The login *form* itself is covered by
// admin/login.e2e.spec.ts.
for (const role of userRoles) {
  setup(`authenticate as ${role}`, async ({ request }) => {
    const { email, password } = testUsers[role]
    const res = await request.post('/api/users/login', {
      data: { email, password },
    })
    if (!res.ok()) {
      throw new Error(`API login failed for ${email} (${res.status()}): ${await res.text()}`)
    }
    // Persists the payload-token cookie set by the login response.
    await request.storageState({ path: authFile(role) })
  })
}
