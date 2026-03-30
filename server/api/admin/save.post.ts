export default defineEventHandler(async (event) => {
  checkAdminAuth(event)
  const { putJsonToR2 } = await import('~~/server/lib/r2')

  const { projects } = await readBody(event)
  if (!Array.isArray(projects)) {
    throw createError({ statusCode: 400, message: 'Invalid projects data' })
  }

  // Validate link fields server-side (reject non-http schemes)
  for (const p of projects) {
    if (p.link && !/^https?:\/\//i.test(p.link)) {
      throw createError({ statusCode: 400, message: `Invalid link URL for project ${p.id}` })
    }
  }

  await putJsonToR2('projects.json', projects)

  return { ok: true, count: projects.length }
})
