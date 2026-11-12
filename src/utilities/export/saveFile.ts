/** Save a URL (a data URL or an object URL) as `filename`. Browser only. */
export function saveUrl(url: string, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  // Firefox only follows a click on an anchor that is in the document.
  document.body.appendChild(link)
  link.click()
  link.remove()
}

/** Save CSV text as `filename`. Browser only. */
export function saveCsv(csv: string, filename: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  saveUrl(url, filename)
  // Revoking in the same tick can cancel the save.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
