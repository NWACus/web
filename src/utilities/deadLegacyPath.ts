// WordPress-era paths from centers' previous sites that have no AvyWeb destination (see #1280).
const DEAD_LEGACY_PATH_PATTERNS: RegExp[] = [
  /^\/feeds\/?$/, // /feeds
  /^\/[\w-]+-rss\.xml$/, // /news-rss.xml, /advisory-rss.xml
  /^\/email-subscriptions\/?$/, // /email-subscriptions
  /^\/weather-station-map\/?$/, // /weather-station-map
  /^\/classes-events(\/|$)/, // /classes-events and everything under it
  /^\/data-portal(\/|$)/, // /data-portal and everything under it
  /^\/forecasts\/tabs(\/|$)/, // /forecasts/tabs and everything under it
  /^\/FAQ\/?$/, // uppercase only, so a real /faq page slug still resolves
  /^\/ie-incompatible\.html$/, // /ie-incompatible.html
  /^\/wp-/, // /wp-admin, /wp-login.php, /wp-content/...
  /\.php$/, // any path ending in .php
  /^\/apple-touch-icon[\w-]*\.png$/, // /apple-touch-icon.png, /apple-touch-icon-precomposed.png
]

export const isDeadLegacyPath = (pathname: string): boolean =>
  DEAD_LEGACY_PATH_PATTERNS.some((pattern) => pattern.test(pathname))
