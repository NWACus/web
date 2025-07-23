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

    it('should filter out invalid tenant slugs and warn', () => {
      const result = validateProductionTenants('nwac,invalid-tenant,sac')
      expect(result).toEqual(['nwac', 'sac'])
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Invalid tenant slugs found in PRODUCTION_TENANTS env var. Omitting: invalid-tenant',
        ),
      )
    })

    it('should filter out multiple invalid tenant slugs and warn', () => {
      const result = validateProductionTenants('invalid1,nwac,invalid2')
      expect(result).toEqual(['nwac'])
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Invalid tenant slugs found in PRODUCTION_TENANTS env var. Omitting: invalid1, invalid2',
        ),
      )
    })

    it('should not warn when all tenant slugs are valid', () => {
      const result = validateProductionTenants('nwac,sac,snfac')
      expect(result).toEqual(['nwac', 'sac', 'snfac'])
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should return empty array when all tenant slugs are invalid', () => {
      const result = validateProductionTenants('invalid1,invalid2,invalid3')
      expect(result).toEqual([])
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Invalid tenant slugs found in PRODUCTION_TENANTS env var. Omitting: invalid1, invalid2, invalid3',
        ),
      )
    })
  })
})
