import { ProductType } from './types/forecastSchemas'

const FORECAST_TITLE = 'Backcountry Avalanche Forecast'
const GENERAL_INFORMATION_TITLE = 'General Avalanche Information'

/**
 * The heading a product is published under, in the legacy widget's wording. Only a `forecast` is a
 * forecast: like the widget, every other type (in practice a `summary`) reads as general
 * information, so a product never claims danger ratings it doesn't carry.
 */
export function productTypeTitle(productType: ProductType): string {
  return productType === ProductType.Forecast ? FORECAST_TITLE : GENERAL_INFORMATION_TITLE
}
