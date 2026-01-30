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

// Tenant cookie management
export {
  TENANT_COOKIE_NAME,
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

// Document save operations
export {
  closeAllToasts,
  openDocControls,
  saveDocAndAssert,
  saveDocHotkeyAndAssert,
  waitForFormReady,
  waitForLoading,
} from './save-doc'
