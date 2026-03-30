export default defineEventHandler(async (event) => {
  checkAdminAuth(event)
  const { getBucketUsage, R2_STORAGE_LIMIT } = await import('~~/server/lib/r2')

  const { totalBytes, objectCount } = await getBucketUsage()
  const limitBytes = R2_STORAGE_LIMIT

  return {
    usedBytes: totalBytes,
    usedGB: Math.round(totalBytes / (1024 ** 3) * 100) / 100,
    limitBytes,
    limitGB: 9,
    percent: Math.round((totalBytes / limitBytes) * 100),
    objectCount,
  }
})
