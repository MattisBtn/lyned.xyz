export default defineEventHandler(async (event) => {
  checkAdminAuth(event)
  const { putJsonToR2 } = await import('~~/server/lib/r2')

  const { frames } = await readBody(event)
  if (!Array.isArray(frames) || frames.length !== 6) {
    throw createError({ statusCode: 400, message: 'Preset must have exactly 6 frames' })
  }

  const sanitized = frames.map((f: any) => {
    const { x, y, w, h, cropX, cropY, zoom } = f
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h) ||
        !Number.isFinite(cropX) || !Number.isFinite(cropY) || !Number.isFinite(zoom)) {
      throw createError({ statusCode: 400, message: 'Frame values must be finite numbers' })
    }
    if (w < 1 || w > 5000 || h < 1 || h > 5000 || x < -5000 || y < -5000 ||
        cropX < 0 || cropX > 1 || cropY < 0 || cropY > 1 || zoom < 0.1 || zoom > 10) {
      throw createError({ statusCode: 400, message: 'Frame values out of range' })
    }
    return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), cropX, cropY, zoom }
  })

  await putJsonToR2('multi-frame-preset.json', { frames: sanitized })

  return { ok: true }
})
