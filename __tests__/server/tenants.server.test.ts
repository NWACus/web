/**
 * @jest-environment node
 */

import { validateProductionTenants } from '@/utilities/tenancy/tenants'

describe('PRODUCTION_TENANTS validation', () => {
  let consoleWarnSpy: jest.SpyInstance

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  describe('validateProductionTenants function', () => {
    it('should handle empty string', () => {
      const result = validateProductionTenants('')
      expect(result).toEqual([])
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should handle undefined', () => {
      const result = validateProductionTenants(undefined)
      expect(result).toEqual([])
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should parse valid comma-separated tenant slugs', () => {
      const result = validateProductionTenants('nwac,sac,snfac')
      expect(result).toEqual(['nwac', 'sac', 'snfac'])
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should handle whitespace in tenant slugs', () => {
      const result = validateProductionTenants(' nwac , sac , snfac ')
      expect(result).toEqual(['nwac', 'sac', 'snfac'])
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should filter out empty strings', () => {
      const result = validateProductionTenants('nwac,,sac,,')
      expect(result).toEqual(['nwac', 'sac'])
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })
})
