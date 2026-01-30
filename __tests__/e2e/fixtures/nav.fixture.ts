import { Page, expect } from '@playwright/test'

/**
 * Opens the admin nav if it's closed.
 * Based on Payload's test/helpers/e2e/toggleNav.ts
 */
export async function openNav(page: Page): Promise<void> {
  // Wait for nav to be hydrated
  await page.locator('.template-default--nav-hydrated').waitFor({ timeout: 10000 })

  // Close any open modals first
  const openModal = page.locator('dialog[open]')
  if (await openModal.isVisible()) {
    await page.keyboard.press('Escape')
    await openModal.waitFor({ state: 'hidden' })
  }

  // Check if nav is already open
  const navOpen = page.locator('.template-default.template-default--nav-open')
  if (await navOpen.isVisible()) {
    return // Nav is already open
  }

  // Click the visible nav toggler (handles responsive design)
  await page.locator('.nav-toggler >> visible=true').click()

  // Wait for nav to finish animating/opening
  await expect(navOpen).toBeVisible({ timeout: 5000 })
}

/**
 * Closes the admin nav if it's open.
 * Based on Payload's test/helpers/e2e/toggleNav.ts
 */
export async function closeNav(page: Page): Promise<void> {
  // Wait for nav to be hydrated
  await page.locator('.template-default--nav-hydrated').waitFor({ timeout: 10000 })

  // Check if nav is open
  const navOpen = page.locator('.template-default.template-default--nav-open')
  if (!(await navOpen.isVisible())) {
    return // Nav is already closed
  }

  // Click the visible nav toggler
  await page.locator('.nav-toggler >> visible=true').click()

  // Wait for nav to close
  await expect(navOpen).not.toBeVisible({ timeout: 5000 })
}
