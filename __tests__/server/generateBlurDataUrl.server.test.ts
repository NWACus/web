import { mkdtemp, rm, writeFile } from 'fs/promises'
import os from 'os'
import path from 'path'
import sharp from 'sharp'

import { generateBlurDataUrl } from '@/collections/Media/hooks/generateBlurDataUrl'

type UploadedFile = {
  data: Buffer
  mimetype: string
  tempFilePath?: string
}

async function runHook(file: UploadedFile) {
  const data: Record<string, unknown> = {}
  // @ts-expect-error the hook only reads req.file, operation and data
  return generateBlurDataUrl({ data, operation: 'create', req: { file } })
}

const png = () =>
  sharp({ create: { width: 16, height: 16, channels: 3, background: '#336699' } })
    .png()
    .toBuffer()

describe('generateBlurDataUrl', () => {
  it('builds a blur placeholder from the file buffer', async () => {
    const result = await runHook({ data: await png(), mimetype: 'image/png' })

    expect(result.blurDataUrl).toMatch(/^data:image\/png;base64,/)
  })

  it('reads the temp file when a client upload arrives with an empty buffer', async () => {
    // Since Payload 3.89 client uploads put the bytes in a temp file and leave `data` empty
    const dir = await mkdtemp(path.join(os.tmpdir(), 'blur-data-url-'))
    const tempFilePath = path.join(dir, 'upload')
    await writeFile(tempFilePath, await png())

    try {
      const result = await runHook({ data: Buffer.alloc(0), mimetype: 'image/png', tempFilePath })

      expect(result.blurDataUrl).toMatch(/^data:image\/png;base64,/)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
