export default defineEventHandler(async (event) => {
  checkAdminAuth(event)
  const { deleteFromR2 } = await import('~~/server/lib/r2')

  const { key } = await readBody(event)
  if (!key || typeof key !== 'string') {
    throw createError({ statusCode: 400, message: 'Missing key' })
  }

  // H3: Validate key prefix to prevent path traversal
  const allowedPrefixes = ['graphic/', 'motion/', 'thumbs/']
  if (!allowedPrefixes.some(p => key.startsWith(p)) || key.includes('..') || key.includes('//')) {
    throw createError({ statusCode: 400, message: 'Invalid key' })
  }

  await deleteFromR2(key)

  // Also delete thumbnail if it's a video
  if (key.startsWith('motion/')) {
    const thumbKey = key.replace('motion/', 'thumbs/').replace(/\.\w+$/, '.webp')
    try { await deleteFromR2(thumbKey) } catch {}
  }

  return { ok: true, deleted: key }
})
