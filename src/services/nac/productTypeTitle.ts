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

/**
 * The product's name in a browser tab or link-preview title. Unlike the heading this stays the
 * short "Avalanche Forecast" for a forecast, and for a widget center, whose product we never read.
 */
export function productTabLabel(productType: ProductType | null | undefined): string {
  return productType == null || productType === ProductType.Forecast
    ? 'Avalanche Forecast'
    : GENERAL_INFORMATION_TITLE
}

/**
 * The all-zones page's heading: a forecast if any zone published one, otherwise general
 * information. Pass only the zones that loaded, so a failed fetch can't change the claim. `null`
 * when nothing loaded, as the widget then shows no heading.
 */
export function allZonesTitle(productTypes: ProductType[]): string | null {
  if (productTypes.length === 0) return null
  return productTypes.includes(ProductType.Forecast) ? FORECAST_TITLE : GENERAL_INFORMATION_TITLE
}
