# Testing


## E2E Tests (Playwright)

End-to-end tests use Playwright to test the admin UI in a real browser.

### Setup

1. Install the Playwright browser (only needed once, or after Playwright version updates):

   ```bash
   pnpm exec playwright install chromium
   ```

2. Seed the database (tests depend on seed data):

   ```bash
   pnpm seed:standalone
   ```

3. Start the dev server:

   ```bash
   pnpm dev
   ```

   Playwright will auto-start it via `webServer` config if it's not running, but having it already running avoids the ~5 minute startup wait on each test run.

### Running Tests

#### Playwright UI (recommended for development)

The UI gives you a visual test runner with step-by-step debugging, DOM snapshots, and trace viewing:

```bash
pnpm test:e2e:ui
```

This opens an interactive window where you can select and run individual tests, watch them execute in a browser, and inspect failures with screenshots and traces.

#### Terminal

```bash
pnpm test:e2e                 # Run all e2e tests
pnpm test:e2e:admin           # Run only admin project tests
pnpm test:e2e:frontend        # Run only frontend project tests
```

To run a specific test file:

```bash
pnpm test:e2e -- __tests__/e2e/admin/tenant-selector/non-tenant.e2e.spec.ts
```

Useful Playwright CLI flags:

```bash
--workers=1          # Run tests sequentially (useful for debugging)
--headed             # Show the browser window while tests run
--debug              # Step through tests with Playwright Inspector
--retries=2          # Retry failed tests
--reporter=list      # Use list reporter instead of HTML
```

Example combining flags:

```bash
pnpm test:e2e -- --workers=1 --headed __tests__/e2e/admin/tenant-selector/non-tenant.e2e.spec.ts
```

### Test Structure

```
__tests__/e2e/
├── auth.setup.ts      # Logs in as each test user and caches browser state
├── admin/             # Admin panel tests (project: admin)
│   └── ...
├── fixtures/          # Reusable setup/teardown logic
│   └── ...
├── helpers/           # Shared utilities
│   └── ...
└── .auth/             # Cached storageState files (gitignored)
```

### Writing Tests

Tests use custom Playwright fixtures that provide login and tenant selector helpers. Import from the fixture that matches your needs:

```typescript
// For tests involving the tenant selector
import { expect, TenantNames, tenantSelectorTest as test } from '../../fixtures/tenant-selector.fixture'

// For tests that just need authentication
import { authTest as test, expect } from '../../fixtures/auth.fixture'
```

Each test creates its own browser context via `loginAs()`, so tests are fully isolated. `loginAs()` uses cached `storageState` files created during the setup phase, so there's no UI login overhead per test. Close the context at the end:

```typescript
test('example', async ({ loginAs, isTenantSelectorVisible }) => {
  const page = await loginAs('superAdmin')
  // ... test logic ...
  await page.context().close()
})
```

### Authentication Caching

The `auth.setup.ts` file runs before all test projects. It logs in as each user role defined in `test-users.ts` via the UI once and saves the browser state (cookies/storage) to `__tests__/e2e/.auth/<role>.json`. Test fixtures then load these files via `storageState` instead of repeating the login flow, saving ~5-15 seconds per test.

If you add a new test user role to `test-users.ts`, it will automatically be included in the setup.

### Known Issues

- **Login flakiness in setup**: `performLogin` retries up to 3 times if the dev server is slow to respond (common on the first request of a test run). The auth setup runs serially with a 60-second timeout to avoid overwhelming the dev server. If you see intermittent setup failures, try `--workers=1`.
- **Tenant cookie stores IDs, not slugs**: The admin UI stores tenant IDs (e.g., `"1"`) in the `payload-tenant` cookie, not slugs (e.g., `"dvac"`). Use `selectTenant(page, TenantNames.xxx)` via the UI instead of `setTenantCookie(page, TenantSlugs.xxx)` when cookie values need to be valid.

## Future Plans

- RBAC tests that log in as various user types (super admin, multi-tenant role, single-tenant role, provider, provider manager) and verify what they can and cannot do
- Inspired by Payload's test setup: https://github.com/payloadcms/payload/blob/main/test


## Unit Tests (Jest)

Unit tests use Jest with a dual-environment setup:

- **Client tests** (`__tests__/client/`) - jsdom environment
- **Server tests** (`__tests__/server/`) - node environment

```bash
pnpm test           # Run all unit tests
pnpm test:watch     # Run in watch mode
```