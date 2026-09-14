// localStorage can throw on any access: SecurityError when the browser blocks
// site data, QuotaExceededError when full (legacy Safari private mode threw on
// every write). Persistence is always optional — failures degrade to
// "works but forgets", never break the feature.

export function readLocalStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeLocalStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Losing persistence is the accepted fallback.
  }
}
