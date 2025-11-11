import { promises as fs } from 'fs'
import path from 'path'
import { File } from 'payload'
import { Logger } from 'pino'

const cache: Record<string, ArrayBuffer> = {}

export async function fetchFileByURL(url: string): Promise<File> {
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
  return file
}

export function getPath(relativePath: string) {
  return path.join(process.cwd(), relativePath)
}

export async function getFileByPath(filePath: string): Promise<File> {
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
  return file
}

export async function getSeedImageByFilename(filename: string, logger: Logger) {
  const path = getPath(`src/endpoints/seed/images/${filename}`)

  try {
    return await getFileByPath(path)
  } catch (error) {
    // Fallback to GitHub URL if the file doesn't exist locally
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      logger.info(`Couldn't find file locally, fetching from GitHub...`)
      const baseUrl =
        'https://raw.githubusercontent.com/NWACus/web/refs/heads/main/src/endpoints/seed/images'
      const fileUrl = `${baseUrl}/${filename}`
      return fetchFileByURL(fileUrl)
    }

    throw error
  }
}

export const pastDate = (monthOffset: number, day: number, hour: number = 18) => {
  const date = new Date()
  date.setMonth(date.getMonth() - monthOffset)
  date.setDate(day)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

// Helper to create dates in the future
export const futureDate = (monthOffset: number, day: number, hour: number = 18) => {
  const date = new Date()
  date.setMonth(date.getMonth() + monthOffset)
  date.setDate(day)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

// Helper to create properly formatted lexical text nodes
export const textNode = (text: string) => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal' as const,
  style: '',
  text,
  version: 1,
})

// Helper to create properly formatted lexical paragraph nodes
export const paragraphNode = (text: string) => ({
  type: 'paragraph',
  children: [textNode(text)],
  direction: 'ltr' as const,
  format: '' as '' | 'left' | 'start' | 'center' | 'right' | 'end' | 'justify',
  indent: 0,
  textFormat: 0,
  version: 1,
})

// Helper to create simple content with just paragraphs
export const simpleContent = (...paragraphs: string[]) => ({
  root: {
    type: 'root',
    children: paragraphs.map(paragraphNode),
    direction: 'ltr' as const,
    format: '' as '' | 'left' | 'start' | 'center' | 'right' | 'end' | 'justify',
    indent: 0,
    version: 1,
  },
})
