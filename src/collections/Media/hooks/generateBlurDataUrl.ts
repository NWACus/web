import { CollectionBeforeChangeHook } from 'payload'
import sharp from 'sharp'

import { Media } from '@/payload-types'

export const generateBlurDataUrl: CollectionBeforeChangeHook<Media> = async ({
  req,
  operation,
  data,
}) => {
  if (!req.file || !req.file.data || operation !== 'create') {
    return data
  }

  const mimetype = req.file.mimetype
  const isValidImage = mimetype.startsWith('image/') && mimetype !== 'image/svg+xml'
  if (!isValidImage) {
    return data
  }

  // Since 3.89 client uploads leave `data` empty and put the bytes in a temp file
  const input = req.file.data.length > 0 ? req.file.data : req.file.tempFilePath
  if (!input) {
    return data
  }

  const buffer = await sharp(input).resize({ width: 8 }).toFormat('webp').toBuffer()

  const base64 = buffer.toString('base64')
  data.blurDataUrl = `data:${mimetype};base64,${base64}`

  return data
}
