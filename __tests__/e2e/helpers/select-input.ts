import { expect, type Locator } from '@playwright/test'

/**
 * Adapted from Payload's test/helpers/e2e/selectInput.ts
 * Handles react-select component interactions in Playwright tests.
 */

type SelectInputParams = {
  /** Locator for the react-select component wrapper */
  selectLocator: Locator
  /** Optional filter text to narrow down options */
  filter?: string
  /** Type of select (affects value selectors) */
  selectType?: 'relationship' | 'select'
} & (
  | {
      /** Multi-selection mode */
      multiSelect: true
      /** Array of visible labels to select */
      options: string[]
      option?: never
      /** Whether to clear selection before selecting new options */
      clear?: boolean
    }
  | {
      /** Single selection mode */
      multiSelect?: false
      /** Single visible label to select */
      option: string
      options?: never
      clear?: never
    }
)

const selectors = {
  hasMany: {
    relationship: '.relationship--multi-value-label__text',
    select: '.multi-value-label__text',
  },
  hasOne: {
    relationship: '.relationship--single-value__text',
    select: '.react-select--single-value',
  },
}

/**
 * Creates an exact text match regex pattern.
 * Use with hasText to match exact option text.
 */
export function exactText(text: string): RegExp {
  return new RegExp(`^${text}$`)
}

/**
 * Opens the react-select dropdown menu if not already open.
 */
export async function openSelectMenu({ selectLocator }: { selectLocator: Locator }): Promise<void> {
  if (await selectLocator.locator('.rs__menu').isHidden()) {
    // Open the react-select dropdown
    await selectLocator.locator('button.dropdown-indicator').click()
  }

  // Wait for the dropdown menu to appear
  const menu = selectLocator.locator('.rs__menu')
  await menu.waitFor({ state: 'visible', timeout: 2000 })
}

/**
 * Clears the current selection in a react-select component.
 */
export async function clearSelectInput({
  selectLocator,
}: {
  selectLocator: Locator
}): Promise<void> {
  const clearButton = selectLocator.locator('.clear-indicator')
  if (await clearButton.isVisible()) {
    const clearButtonCount = await clearButton.count()
    if (clearButtonCount > 0) {
      await clearButton.click()
    }
  }
}

/**
 * Selects a single option from the dropdown.
 */
async function selectOption({
  selectLocator,
  optionText,
}: {
  selectLocator: Locator
  optionText: string
}): Promise<void> {
  await openSelectMenu({ selectLocator })

  // Find and click the desired option by visible text
  const optionLocator = selectLocator.locator('.rs__option', {
    hasText: exactText(optionText),
  })

  await optionLocator.click()
}

/**
 * Selects one or more options in a react-select component.
 *
 * @example
 * // Single selection
 * await selectInput({
 *   selectLocator: page.locator('.tenant-selector'),
 *   option: 'NWAC',
 * })
 *
 * @example
 * // Multi-selection
 * await selectInput({
 *   selectLocator: page.locator('.tags-field'),
 *   multiSelect: true,
 *   options: ['Tag 1', 'Tag 2'],
 *   clear: true,
 * })
 */
export async function selectInput({
  selectLocator,
  options,
  option,
  multiSelect = false,
  clear = true,
  filter,
  selectType = 'select',
}: SelectInputParams): Promise<void> {
  if (filter) {
    // Open the select menu to access the input field
    await openSelectMenu({ selectLocator })

    // Type the filter text into the input field
    const inputLocator = selectLocator.locator('.rs__input[type="text"]')
    await inputLocator.fill(filter)
  }

  if (multiSelect && options) {
    if (clear) {
      await clearSelectInput({ selectLocator })
    }

    for (const optionText of options) {
      // Check if the option is already selected
      const alreadySelected = await selectLocator
        .locator(selectors.hasMany[selectType], {
          hasText: optionText,
        })
        .count()

      if (alreadySelected === 0) {
        await selectOption({ selectLocator, optionText })
      }
    }
  } else if (option) {
    // For single selection, ensure only one option is selected
    const alreadySelected = await selectLocator
      .locator(selectors.hasOne[selectType], {
        hasText: option,
      })
      .count()

    if (alreadySelected === 0) {
      await selectOption({ selectLocator, optionText: option })
    }
  }
}

/**
 * Gets the current value(s) from a react-select component.
 *
 * @returns For single select: the selected value string, or false/undefined if none
 * @returns For multi select: array of selected value strings
 */
export async function getSelectInputValue(params: {
  selectLocator: Locator
  multiSelect: true
  selectType?: 'relationship' | 'select'
}): Promise<string[]>
export async function getSelectInputValue(params: {
  selectLocator: Locator
  multiSelect?: false
  selectType?: 'relationship' | 'select'
}): Promise<string | false | undefined>
export async function getSelectInputValue({
  selectLocator,
  multiSelect = false,
  selectType = 'select',
}: {
  selectLocator: Locator
  multiSelect?: boolean
  selectType?: 'relationship' | 'select'
}): Promise<string[] | string | false | undefined> {
  if (multiSelect) {
    const selectedOptions = await selectLocator
      .locator(selectors.hasMany[selectType])
      .allTextContents()
    return selectedOptions || []
  }

  await expect(selectLocator).toBeVisible()

  const valueLocator = selectLocator.locator(selectors.hasOne[selectType])
  const count = await valueLocator.count()
  if (count === 0) {
    return false
  }
  const singleValue = await valueLocator.textContent()
  return singleValue ?? undefined
}

/**
 * Gets all available options from a react-select dropdown.
 */
export async function getSelectInputOptions({
  selectLocator,
}: {
  selectLocator: Locator
}): Promise<string[]> {
  await openSelectMenu({ selectLocator })
  const options = await selectLocator.locator('.rs__option').allTextContents()
  return options.map((option) => option.trim()).filter(Boolean)
}

/**
 * Checks if a react-select component is disabled/read-only.
 */
export async function isSelectReadOnly({
  selectLocator,
}: {
  selectLocator: Locator
}): Promise<boolean> {
  // Check for the read-only class that Payload adds
  const hasReadOnlyClass = await selectLocator.locator('.field-type.read-only').count()
  if (hasReadOnlyClass > 0) return true

  // Check if the dropdown indicator is not clickable
  const dropdownIndicator = selectLocator.locator('button.dropdown-indicator')
  if ((await dropdownIndicator.count()) === 0) return true

  // Try to check if it's disabled
  const isDisabled = await dropdownIndicator.isDisabled().catch(() => false)
  return isDisabled
}
