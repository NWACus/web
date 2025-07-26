// normalize paths by removing leading/trailing slashes
export function normalizePath(path: string): string {
  return path.replace(/^\/+|\/+$/g, '')
}
