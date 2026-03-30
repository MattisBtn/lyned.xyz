// Dynamic imports to avoid IPC crash in dev

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

// Parse WebP RIFF header to extract width/height (first 30 bytes suffice)
function parseWebpDimensions(buf: ArrayBuffer): { w: number, h: number } | null {
  const view = new DataView(buf)
  if (buf.byteLength < 30) return null
  // RIFF header: bytes 0-3 = "RIFF", 8-11 = "WEBP", 12-15 = chunk type
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
  if (riff !== 'RIFF') return null
  const chunk = String.fromCharCode(view.getUint8(12), view.getUint8(13), view.getUint8(14), view.getUint8(15))
  if (chunk === 'VP8 ') {
    // Lossy: width/height at bytes 26-29 (little-endian 16-bit each)
    const w = view.getUint16(26, true) & 0x3FFF
    const h = view.getUint16(28, true) & 0x3FFF
    return w && h ? { w, h } : null
  }
  if (chunk === 'VP8L') {
    // Lossless: dimensions packed in bytes 21-24
    const bits = view.getUint32(21, true)
    const w = (bits & 0x3FFF) + 1
    const h = ((bits >> 14) & 0x3FFF) + 1
    return { w, h }
  }
  if (chunk === 'VP8X') {
    // Extended: canvas size at bytes 24-29 (24-bit LE each)
    const w = (view.getUint8(24) | (view.getUint8(25) << 8) | (view.getUint8(26) << 16)) + 1
    const h = (view.getUint8(27) | (view.getUint8(28) << 8) | (view.getUint8(29) << 16)) + 1
    return { w, h }
  }
  return null
}

export default defineEventHandler(async (event) => {
  checkAdminAuth(event)

  const { listR2Objects, putJsonToR2, getFromR2, getBytesFromR2 } = await import('~~/server/lib/r2')
  const PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

  // Load existing projects to preserve metadata (description, link)
  let existingMeta: Record<string, { description?: string, link?: string }> = {}
  try {
    const existingJson = await getFromR2('projects.json')
    if (existingJson) {
      const existing = JSON.parse(existingJson)
      for (const p of existing) {
        if (p.description || p.link) {
          existingMeta[p.id] = { description: p.description, link: p.link }
        }
      }
    }
  } catch { /* no existing data */ }

  // Note: aspectRatio is computed fresh each ingest (not preserved from metadata)

  const allKeys = await listR2Objects()
  const graphic = allKeys.filter(k => k.startsWith('graphic/') && k.endsWith('.webp'))
  const motion = allKeys.filter(k => k.startsWith('motion/') && k.endsWith('.mp4'))
  const thumbs = allKeys.filter(k => k.startsWith('thumbs/') && k.endsWith('.webp'))

  // Build projects
  const allProjects = [
    ...graphic.map(key => {
      const slug = key.replace('graphic/', '').replace('.webp', '')
      return {
        id: slug,
        title: slug.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        type: 'image' as const,
        src: `${PUBLIC_URL}/${key}`,
        thumbnail: `${PUBLIC_URL}/${key}`,
      }
    }),
    ...motion.map(key => {
      const slug = key.replace('motion/', '').replace('.mp4', '')
      const thumbKey = `thumbs/${slug}.webp`
      const hasThumb = thumbs.includes(thumbKey)
      return {
        id: slug,
        title: slug.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        type: 'video' as const,
        src: `${PUBLIC_URL}/${key}`,
        thumbnail: hasThumb ? `${PUBLIC_URL}/${thumbKey}` : `${PUBLIC_URL}/${key}`,
      }
    }),
  ]

  // Fetch aspect ratios from WebP headers (30 bytes each, parallel)
  const ratioMap: Record<string, number> = {}
  const webpKeys = [
    ...graphic,
    ...thumbs,
  ]
  await Promise.all(webpKeys.map(async (key) => {
    try {
      const buf = await getBytesFromR2(key, 30)
      if (!buf) return
      const dims = parseWebpDimensions(buf)
      if (!dims) return
      // Map to project slug
      const slug = key.replace(/^(graphic|thumbs)\//, '').replace('.webp', '')
      ratioMap[slug] = Math.round((dims.w / dims.h) * 1000) / 1000
    } catch { /* skip */ }
  }))

  // Assign aspectRatio to projects
  for (const p of allProjects) {
    const ratio = ratioMap[p.id]
    if (ratio) (p as any).aspectRatio = ratio
  }

  // Organic placement
  const rand = seededRandom(42)
  const shuffled = [...allProjects]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const GAP = 160, CANVAS_W = 4500, MARGIN = 150
  const placed: any[] = []

  function overlaps(rect: any) {
    for (const p of placed) {
      if (rect.x < p.x + p.width + GAP && rect.x + rect.width + GAP > p.x &&
          rect.y < p.y + p.height + GAP && rect.y + rect.height + GAP > p.y) return true
    }
    return false
  }

  for (const item of shuffled) {
    const widths = [260, 280, 300, 320, 340]
    const w = widths[Math.floor(rand() * widths.length)]
    const h = item.type === 'video'
      ? Math.round(w * (9 / 16) + (rand() - 0.5) * 20)
      : Math.round(w * (0.7 + rand() * 0.4))
    const height = Math.max(150, h) + 40

    const candidates = [{ x: MARGIN, y: MARGIN }]
    for (const p of placed) {
      const ex = Math.round(rand() * 200), ey = Math.round(rand() * 200)
      candidates.push({ x: p.x + p.width + GAP + ex, y: p.y })
      candidates.push({ x: p.x, y: p.y + p.height + GAP + ey })
      candidates.push({ x: p.x + p.width + GAP + ex, y: p.y + Math.round(p.height * 0.3) })
      candidates.push({ x: p.x + Math.round(p.width * 0.4), y: p.y + p.height + GAP + ey })
    }

    const valid = candidates
      .filter(c => c.x + w <= CANVAS_W && c.x >= MARGIN && c.y >= MARGIN)
      .filter(c => !overlaps({ x: c.x, y: c.y, width: w, height }))
      .sort((a, b) => (a.y * 2 + a.x) - (b.y * 2 + b.x))

    const pos = valid[0] || { x: MARGIN, y: (placed[placed.length - 1]?.y ?? 0) + 400 }
    const nm = Math.floor(GAP * 0.35)
    const nx = Math.round((rand() - 0.5) * nm * 2)
    const ny = Math.round((rand() - 0.5) * nm * 2)
    const fx = Math.max(MARGIN, pos.x + nx), fy = Math.max(MARGIN, pos.y + ny)
    const noisy = { x: fx, y: fy, width: w, height }
    const ok = !overlaps(noisy) && fx + w <= CANVAS_W

    const meta = existingMeta[item.id] || {}
    placed.push({ ...item, ...meta, x: ok ? fx : pos.x, y: ok ? fy : pos.y, width: w, height })
  }

  await putJsonToR2('projects.json', placed)

  return {
    ok: true,
    output: `Generated ${placed.length} projects (${graphic.length} images, ${motion.length} videos)`,
  }
})
