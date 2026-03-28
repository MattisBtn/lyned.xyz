export default defineEventHandler(async () => {
  const { getFromR2 } = await import('~~/server/lib/r2')
  const json = await getFromR2('projects.json')
  try {
    return json ? JSON.parse(json) : []
  } catch {
    return []
  }
})
