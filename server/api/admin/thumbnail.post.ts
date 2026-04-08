export default defineEventHandler(async (event) => {
  checkAdminAuth(event)
  const { uploadToR2 } = await import('~~/server/lib/r2')

  const files = await readMultipartFormData(event)
  if (!files || files.length === 0) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  const slugField = files.find(f => f.name === 'slug')
  const imageField = files.find(f => f.name === 'image')

  if (!slugField || !imageField?.data) {
    throw createError({ statusCode: 400, message: 'Missing slug or image' })
  }

  const slug = slugField.data.toString('utf-8').trim()
  if (!slug || slug.includes('..') || slug.includes('/')) {
    throw createError({ statusCode: 400, message: 'Invalid slug' })
  }

  const key = `thumbs/${slug}.webp`
  const url = await uploadToR2(key, imageField.data, 'image/webp')

  return { ok: true, key, url }
})
