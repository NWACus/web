/**
 * E2E Test Helpers
 *
 * This module exports all test utilities for Playwright E2E tests.
 * Helpers are adapted from Payload's test suite patterns.
 */

// React-select component interactions
export {
  clearSelectInput,
  exactText,
  getSelectInputOptions,
  getSelectInputValue,
  isSelectReadOnly,
  openSelectMenu,
  selectInput,
} from './select-input'

// Admin URL construction
export { AdminUrlUtil, CollectionSlugs, GlobalSlugs } from './admin-url'

// Document creation/cleanup and other API calls via in-page fetch
export {
  MINIMAL_CONTENT_BLOCK,
  MINIMAL_LEXICAL,
  apiRequest,
  createDraftDoc,
  createPublishedDoc,
  deleteDoc,
} from './create-doc'

// Tenant cookie management
export {
  TENANT_COOKIE_NAME,
  TenantIds,
  TenantNames,
  TenantSlugs,
  clearTenantCookie,
  clearTenantCookieFromPage,
  getTenantCookie,
  getTenantCookieFromPage,
  setTenantCookie,
  setTenantCookieFromPage,
  waitForTenantCookie,
  type TenantSlug,
} from './tenant-cookie'

// Tenant frontend origins
export { ROOT_DOMAIN, tenantBaseUrl } from './tenant-url'

// Login
export { performLogin, submitLoginForm } from './login'

// Document save operations
export {
  closeAllToasts,
  openDocControls,
  saveDocAndAssert,
  saveDocHotkeyAndAssert,
  waitForFormReady,
  waitForLoading,
} from './save-doc'

// Tenant onboarding checklist
export { getChecklist } from './onboarding-checklist'
