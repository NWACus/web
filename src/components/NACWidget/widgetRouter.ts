import { match, MatchFunction } from 'path-to-regexp'

export type WidgetPageWithRouterKey =
  | 'forecasts'
  | 'forecast-zone'
  | 'weather-stations'
  | 'recent-observations'
  | 'submit-observation'

export const pathsByWidgetPage: Record<WidgetPageWithRouterKey, string[]> = {
  forecasts: ['/all'],
  'forecast-zone': [
    '/archive',
    '/archive/forecast',
    '/archive/visual',
    '/archive/weather',
    '/archive/post',
    '/:zone/',
    '/:zone/:tab',
    '/forecast/:zone/:id',
    '/forecast/:zone/:id/:tab',
    '/blog',
    '/blog/:id',
    '/post',
    '/post/:id',
  ],
  'weather-stations': ['/', '/station-table', '/station-table/:id', '/:id'],
  'recent-observations': [
    '/view/observations',
    '/view/observations/:id',
    '/view/avalanches',
    '/view/avalanches/:id',
    '/view/visual',
    '/view/visual/:id',
    '/observation/:id',
    '/avalanche/:id',
  ],
  'submit-observation': ['/form', '/advanced-form', '/submit'],
}

export type PathMatcher = MatchFunction<Record<string, string>>

export const pathMatchersByWidgetPage: Record<WidgetPageWithRouterKey, PathMatcher[]> = {
  forecasts: pathsByWidgetPage.forecasts.map((p) => match(p)),
  'forecast-zone': pathsByWidgetPage['forecast-zone'].map((p) => match(p)),
  'weather-stations': pathsByWidgetPage['weather-stations'].map((p) => match(p)),
  'recent-observations': pathsByWidgetPage['recent-observations'].map((p) => match(p)),
  'submit-observation': pathsByWidgetPage['submit-observation'].map((p) => match(p)),
}

export function getMatchersByWidgetPage(widgetPageKey: WidgetPageWithRouterKey) {
  return pathMatchersByWidgetPage[widgetPageKey]
}

export function isValidPath(path: string, matchers: PathMatcher[]): boolean {
  return matchers.some((matcher) => matcher(path))
}
