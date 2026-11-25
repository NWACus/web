'use client'

import { createContext, useContext } from 'react'

/**
 * Popovers and selects sit under the site header (`z-[60]`), but one opened from inside a drawer has
 * to sit above the drawer. Context reaches through portals, so nested popups get it too.
 */
const InDrawerContext = createContext(false)

export const InDrawerProvider = InDrawerContext.Provider

export const usePopupLayer = () => (useContext(InDrawerContext) ? 'z-[60]' : 'z-50')
