/**
 * Test user credentials for E2E tests.
 *
 * Password is configurable via E2E_TEST_PASSWORD env var.
 * Default is 'localpass' which matches ALLOW_SIMPLE_PASSWORDS=true in local/CI.
 */

const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'localpass'

export type UserRole =
  | 'superAdmin'
  | 'providerManager'
  | 'multiTenantAdmin'
  | 'singleTenantAdmin'
  | 'singleTenantForecaster'
  | 'singleTenantStaff'
  | 'providerUser'
  | 'multiProviderUser'

export interface TestUser {
  email: string
  password: string
  description: string
  /** Tenants this user has access to (empty = global access or no tenant access) */
  tenants: string[]
  /** Provider slugs this user is associated with */
  providers: string[]
}

export const testUsers: Record<UserRole, TestUser> = {
  superAdmin: {
    email: 'admin@avy.com',
    password: TEST_PASSWORD,
    description: 'Global Super Admin with full access',
    tenants: [], // Has access to all via global role
    providers: [],
  },
  providerManager: {
    email: 'provider-manager@avy.com',
    password: TEST_PASSWORD,
    description: 'Global Provider Manager role',
    tenants: [],
    providers: [], // Can manage all providers via global role
  },
  multiTenantAdmin: {
    email: 'multicenter@avy.com',
    password: TEST_PASSWORD,
    description: 'Admin for NWAC and SNFAC tenants',
    tenants: ['nwac', 'snfac'],
    providers: [],
  },
  singleTenantAdmin: {
    email: 'admin@nwac.us',
    password: TEST_PASSWORD,
    description: 'Admin for NWAC tenant only',
    tenants: ['nwac'],
    providers: [],
  },
  singleTenantForecaster: {
    email: 'forecaster@nwac.us',
    password: TEST_PASSWORD,
    description: 'Forecaster role for NWAC tenant',
    tenants: ['nwac'],
    providers: [],
  },
  singleTenantStaff: {
    email: 'staff@nwac.us',
    password: TEST_PASSWORD,
    description: 'Non-Profit Staff role for NWAC tenant',
    tenants: ['nwac'],
    providers: [],
  },
  providerUser: {
    email: 'sarah@alpineskills.com',
    password: TEST_PASSWORD,
    description: 'User associated with Alpine Skills International provider',
    tenants: [],
    providers: ['alpine-skills-international'],
  },
  multiProviderUser: {
    email: 'emma@backcountryalliance.org',
    password: TEST_PASSWORD,
    description: 'User associated with multiple providers',
    tenants: [],
    providers: ['backcountry-alliance', 'mountain-education-center'],
  },
}

/** Helper to get a user by role */
export function getTestUser(role: UserRole): TestUser {
  return testUsers[role]
}

/** All user roles for parameterized tests */
export const allUserRoles = Object.keys(testUsers)
