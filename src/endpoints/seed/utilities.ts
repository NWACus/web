import { File } from 'payload'

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
  }

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}
