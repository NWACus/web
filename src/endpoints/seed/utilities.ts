import { promises as fs } from 'fs'
import path from 'path'
import { File } from 'payload'

const cache: Record<string, ArrayBuffer> = {}

export async function fetchFileByURL(url: string): Promise<File> {
  const start = performance.now()
  let data: ArrayBuffer | undefined = undefined
  if (url in cache) {
    data = cache[url]
  } else {
    const res = await fetch(url, {
      credentials: 'include',
      method: 'GET',
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
    }

    data = await res.arrayBuffer()
    cache[url] = data
  }

  const file: File = {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
  const end = performance.now()
  console.log(`fetchFileByURL for ${url} took ${(end - start).toFixed(2)}ms`)
  return file
}

export function getPath(relativePath: string) {
  return path.join(process.cwd(), relativePath)
}

export async function getFileByPath(filePath: string): Promise<File> {
  const start = performance.now()
  const data = await fs.readFile(filePath)
  const name = path.basename(filePath)
  const ext = path.extname(filePath).slice(1)

  let mimetype = 'application/octet-stream'
  const extToMime: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    txt: 'text/plain',
    json: 'application/json',
    html: 'text/html',
    csv: 'text/csv',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
  }
  if (ext && extToMime[ext.toLowerCase()]) {
    mimetype = extToMime[ext.toLowerCase()]
  }
  const file: File = {
    name,
    data,
    mimetype,
    size: data.byteLength,
  }
  const end = performance.now()
  console.log(`getFileByPath for ${filePath} took ${(end - start).toFixed(2)}ms`)
  return file
}
