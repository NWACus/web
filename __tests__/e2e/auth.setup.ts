import { test as setup } from '@playwright/test'
import { testUsers, type UserRole } from './fixtures/test-users'
import { authFile } from './helpers/auth-state'

// Authenticate via the REST login endpoint rather than driving the login form.
// It sets the same `payload-token` cookie the UI flow does, but skips form
// hydration (the main source of setup flakiness) and route compilation, so it's
// far faster and more reliable. The login *form* itself is covered by
// admin/login.e2e.spec.ts.
for (const [role, user] of Object.entries(testUsers)) {
  setup(`authenticate as ${role}`, async ({ request }) => {
    const res = await request.post('/api/users/login', {
      data: { email: user.email, password: user.password },
    })
    if (!res.ok()) {
      throw new Error(`API login failed for ${user.email} (${res.status()}): ${await res.text()}`)
    }
    // Persists the payload-token cookie set by the login response.
    await request.storageState({ path: authFile(role as UserRole) })
  })
}
