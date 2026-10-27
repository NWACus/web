/** Save a URL (a data: or blob: URL of a chart's export) as `filename`. */
export function saveUrl(url: string, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  // Firefox only follows a click on an anchor that is in the document.
  document.body.appendChild(link)
  link.click()
  link.remove()
}
