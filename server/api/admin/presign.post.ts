const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

const ALLOWED_VIDEO_TYPES: Record<string, boolean> = {
  'video/mp4': true,
  'video/webm': true,
}

export default defineEventHandler(async (event) => {
  checkAdminAuth(event)
  const { getPresignedUploadUrl, getBucketUsage, R2_STORAGE_LIMIT, getR2PublicUrl } = await import('~~/server/lib/r2')

  const body = await readBody<{ filename: string, contentType: string, size: number }>(event)

  if (!body?.filename || !body?.contentType || !body?.size) {
    throw createError({ statusCode: 400, message: 'Missing filename, contentType, or size' })
  }

  if (body.size > MAX_FILE_SIZE) {
    throw createError({ statusCode: 413, message: 'File exceeds 50MB limit' })
  }

  if (!ALLOWED_VIDEO_TYPES[body.contentType]) {
    throw createError({ statusCode: 400, message: 'Only MP4 and WebM videos are allowed via presigned upload' })
  }

  // Check storage limit
  const { totalBytes } = await getBucketUsage()
  if (totalBytes + body.size > R2_STORAGE_LIMIT) {
    const usedGB = (totalBytes / (1024 ** 3)).toFixed(2)
    const limitGB = (R2_STORAGE_LIMIT / (1024 ** 3)).toFixed(0)
    throw createError({ statusCode: 413, message: `Storage limit reached (${usedGB}GB / ${limitGB}GB). Delete assets before uploading.` })
  }

  const ext = body.contentType === 'video/webm' ? 'webm' : 'mp4'
  const slug = body.filename
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_]/g, '')

  if (!slug || slug.includes('..')) {
    throw createError({ statusCode: 400, message: 'Invalid filename' })
  }

  const key = `motion/${slug}.${ext}`
  const presignedUrl = await getPresignedUploadUrl(key, body.contentType, body.size)
  const publicUrl = getR2PublicUrl(key)

  return { url: presignedUrl, key, publicUrl, type: 'video' }
})
