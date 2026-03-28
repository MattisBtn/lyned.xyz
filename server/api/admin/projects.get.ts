export default defineEventHandler(async (event) => {
  checkAdminAuth(event)

  const { getFromR2 } = await import('~~/server/lib/r2')
  const json = await getFromR2('projects.json')
  let projects: any[] = []
  try { if (json) projects = JSON.parse(json) } catch { /* corrupted */ }

  return { projects }
})
