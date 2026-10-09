import { productTypeTitle } from '../../src/services/nac/productTypeTitle'
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
