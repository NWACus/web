import {
  allZonesTitle,
  productTabLabel,
  productTypeTitle,
} from '../../src/services/nac/productTypeTitle'
import { ProductType } from '../../src/services/nac/types/forecastSchemas'

describe('productTypeTitle', () => {
  it('titles a forecast as a backcountry avalanche forecast', () => {
    expect(productTypeTitle(ProductType.Forecast)).toBe('Backcountry Avalanche Forecast')
  })

  it('titles a summary as general avalanche information', () => {
    expect(productTypeTitle(ProductType.Summary)).toBe('General Avalanche Information')
  })

  it.each([ProductType.Warning, ProductType.Watch, ProductType.Special, ProductType.Weather])(
    'titles any other type (%s) as general information, never as a forecast',
    (productType) => {
      expect(productTypeTitle(productType)).toBe('General Avalanche Information')
    },
  )
})

describe('productTabLabel', () => {
  it('keeps the short "Avalanche Forecast" for a forecast, or when the product is unknown', () => {
    expect(productTabLabel(ProductType.Forecast)).toBe('Avalanche Forecast')
    expect(productTabLabel(undefined)).toBe('Avalanche Forecast')
    expect(productTabLabel(null)).toBe('Avalanche Forecast')
  })

  it('names a summary as general avalanche information', () => {
    expect(productTabLabel(ProductType.Summary)).toBe('General Avalanche Information')
  })
})

// Forecast-145
describe('allZonesTitle', () => {
  it('heads the page as a forecast when any zone published one', () => {
    expect(allZonesTitle([ProductType.Summary, ProductType.Forecast])).toBe(
      'Backcountry Avalanche Forecast',
    )
  })

  it('heads it as general information when every loaded zone has a summary', () => {
    expect(allZonesTitle([ProductType.Summary, ProductType.Summary])).toBe(
      'General Avalanche Information',
    )
  })

  it('has no heading when no zone loaded', () => {
    expect(allZonesTitle([])).toBeNull()
  })
})
