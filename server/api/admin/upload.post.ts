const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// Magic bytes for file type validation
const MAGIC = {
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF
  png: [0x89, 0x50, 0x4E, 0x47],
  jpg: [0xFF, 0xD8, 0xFF],
  mp4_ftyp: [0x66, 0x74, 0x79, 0x70], // "ftyp" at offset 4
  webm: [0x1A, 0x45, 0xDF, 0xA3],
}

function checkMagic(data: Buffer | Uint8Array, expected: number[], offset = 0): boolean {
  for (let i = 0; i < expected.length; i++) {
    if (data[offset + i] !== expected[i]) return false
  }
  return true
}

function isValidImage(data: Buffer | Uint8Array): boolean {
  return checkMagic(data, MAGIC.webp) || checkMagic(data, MAGIC.png) || checkMagic(data, MAGIC.jpg)
}

function isValidVideo(data: Buffer | Uint8Array): boolean {
  return checkMagic(data, MAGIC.mp4_ftyp, 4) || checkMagic(data, MAGIC.webm)
}

export default defineEventHandler(async (event) => {
  checkAdminAuth(event)
  const { uploadToR2 } = await import('~~/server/lib/r2')

  const files = await readMultipartFormData(event)
  if (!files || files.length === 0) {
    throw createError({ statusCode: 400, message: 'No files uploaded' })
  }

  const uploaded: { key: string, url: string, type: string }[] = []
  const errors: string[] = []

  for (const file of files) {
    if (!file.filename || !file.data) continue

    // H2: Size limit
    if (file.data.length > MAX_FILE_SIZE) {
      errors.push(`${file.filename}: exceeds 50MB limit`)
      continue
    }

    const ext = file.filename.split('.').pop()?.toLowerCase() || ''
    const slug = file.filename
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-_.]/g, '')

    // M4: Only accept MP4 and WebM for videos (reject MKV/MOV)
    const isVideo = ['mp4', 'webm'].includes(ext)
    const isImage = ['webp', 'png', 'jpg', 'jpeg'].includes(ext)

    if (!isVideo && !isImage) {
      if (['mkv', 'mov'].includes(ext)) {
        errors.push(`${file.filename}: MKV/MOV not supported — please convert to MP4`)
      }
      continue
    }

    // M2: Magic byte validation
    if (isImage && !isValidImage(file.data)) {
      errors.push(`${file.filename}: invalid image file`)
      continue
    }
    if (isVideo && !isValidVideo(file.data)) {
      errors.push(`${file.filename}: invalid video file`)
      continue
    }

    const key = isVideo
      ? `motion/${slug}.${ext}`
      : `graphic/${slug}.webp`

    const contentType = isVideo
      ? (ext === 'webm' ? 'video/webm' : 'video/mp4')
      : 'image/webp'

    const url = await uploadToR2(key, file.data, contentType)
    uploaded.push({ key, url, type: isVideo ? 'video' : 'image' })
  }

  return { ok: true, files: uploaded, errors: errors.length ? errors : undefined }
})
