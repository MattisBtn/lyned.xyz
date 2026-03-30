export default defineEventHandler(async () => {
  const { getFromR2 } = await import('~~/server/lib/r2')
  try {
    const json = await getFromR2('multi-frame-preset.json')
    if (json) return JSON.parse(json)
  } catch { /* fallback */ }
  return null
})
