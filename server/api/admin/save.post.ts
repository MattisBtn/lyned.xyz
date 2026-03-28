export default defineEventHandler(async (event) => {
  checkAdminAuth(event)
  const { putJsonToR2 } = await import('~~/server/lib/r2')

  const { projects } = await readBody(event)
  if (!Array.isArray(projects)) {
    throw createError({ statusCode: 400, message: 'Invalid projects data' })
  }

  await putJsonToR2('projects.json', projects)

  return { ok: true, count: projects.length }
})
