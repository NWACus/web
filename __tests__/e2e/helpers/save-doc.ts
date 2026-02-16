import { expect, type Page } from '@playwright/test'

/**
 * Saves a document and asserts the result.
 * Adapted from Payload's test patterns.
 *
 * @param page - The Playwright page
 * @param selector - The save button selector (default: '#action-save')
 * @param expectation - Expected outcome: 'success' or 'error'
 * @param options - Additional options
 */
export async function saveDocAndAssert(
  page: Page,
  selector = '#action-save',
  expectation: 'success' | 'error' = 'success',
  options?: {
    /** If true, don't dismiss toasts after assertion */
    disableDismissAllToasts?: boolean
    /** Timeout for waiting for toast (default: 10000) */
    timeout?: number
  },
): Promise<void> {
  const timeout = options?.timeout ?? 10000

  // Click the save button
  await page.click(selector)

  if (expectation === 'success') {
    // Wait for success toast
    await expect(page.locator('.toast-success, .Toastify__toast--success')).toBeVisible({
      timeout,
    })
  } else {
    // Wait for error toast
    await expect(page.locator('.toast-error, .Toastify__toast--error')).toBeVisible({
      timeout,
    })
  }

  // Dismiss toasts unless disabled
  if (!options?.disableDismissAllToasts) {
    await closeAllToasts(page)
  }
}

/**
 * Saves a document using keyboard shortcut (Cmd/Ctrl+S).
 */
export async function saveDocHotkeyAndAssert(
  page: Page,
  expectation: 'success' | 'error' = 'success',
  options?: {
    disableDismissAllToasts?: boolean
    timeout?: number
  },
): Promise<void> {
  const timeout = options?.timeout ?? 10000
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'

  await page.keyboard.press(`${modifier}+s`)

  if (expectation === 'success') {
    await expect(page.locator('.toast-success, .Toastify__toast--success')).toBeVisible({
      timeout,
    })
  } else {
    await expect(page.locator('.toast-error, .Toastify__toast--error')).toBeVisible({
      timeout,
    })
  }

  if (!options?.disableDismissAllToasts) {
    await closeAllToasts(page)
  }
}

/**
 * Closes all visible toast notifications.
 */
export async function closeAllToasts(page: Page): Promise<void> {
  // Click all toast close buttons
  const closeButtons = page.locator(
    '.toast-close-button, .Toastify__close-button, [aria-label="close"]',
  )
  const count = await closeButtons.count()

  for (let i = 0; i < count; i++) {
    const button = closeButtons.nth(i)
    if (await button.isVisible()) {
      await button.click().catch(() => {
        // Toast may have auto-dismissed, ignore errors
      })
    }
  }

  // Wait briefly for toasts to animate out
  await page.waitForTimeout(300)
}

/**
 * Waits for the form to be ready (all fields loaded).
 * Payload sets data-form-ready="false" while loading.
 */
export async function waitForFormReady(page: Page, timeout = 10000): Promise<void> {
  await expect
    .poll(async () => (await page.locator('[data-form-ready="false"]').count()) === 0, {
      timeout,
    })
    .toBe(true)
}

/**
 * Waits for any loading indicators to disappear.
 */
export async function waitForLoading(page: Page, timeout = 10000): Promise<void> {
  // Wait for Payload's loading indicator to disappear
  const loadingIndicator = page.locator('.loading-overlay, .payload-loading')
  await loadingIndicator.waitFor({ state: 'hidden', timeout }).catch(() => {
    // Loading indicator may not exist, which is fine
  })
}

/**
 * Opens the document controls dropdown (kebab menu).
 */
export async function openDocControls(page: Page): Promise<void> {
  const docControls = page.locator('.doc-controls__popup .popup-button')
  await docControls.click()
  await expect(page.locator('.doc-controls__popup .popup__content')).toBeVisible()
}
