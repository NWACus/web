interface NormalizePathOptions {
  ensureLeadingSlash?: boolean
}

/**
 * Normalize paths by handling multiple slashes and optionally ensuring leading slash
 * @param path - The path to normalize
 * @param options - Optional configuration
 * @returns The normalized path
 */
export function normalizePath(path: string, options: NormalizePathOptions = {}): string {
  const { ensureLeadingSlash = false } = options

  // Remove multiple leading slashes and trailing slashes
  let normalized = path.replace(/^\/+/, '/').replace(/\/+$/, '')

  // Remove leading slash if ensureLeadingSlash is false
  if (!ensureLeadingSlash && normalized.startsWith('/')) {
    normalized = normalized.slice(1)
  }

  // Add leading slash if ensureLeadingSlash is true and path doesn't start with one
  if (ensureLeadingSlash && !normalized.startsWith('/')) {
    normalized = '/' + normalized
  }

  return normalized
}
