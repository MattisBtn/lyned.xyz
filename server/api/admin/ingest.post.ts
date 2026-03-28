// Dynamic imports to avoid IPC crash in dev

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export default defineEventHandler(async (event) => {
  checkAdminAuth(event)

  const { listR2Objects, putJsonToR2 } = await import('~~/server/lib/r2')
  const PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

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

  // Organic placement
  const rand = seededRandom(42)
  const shuffled = [...allProjects]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const GAP = 100, CANVAS_W = 3000, MARGIN = 100
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
      const ex = Math.round(rand() * 120), ey = Math.round(rand() * 120)
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

    placed.push({ ...item, x: ok ? fx : pos.x, y: ok ? fy : pos.y, width: w, height })
  }

  await putJsonToR2('projects.json', placed)

  return {
    ok: true,
    output: `Generated ${placed.length} projects (${graphic.length} images, ${motion.length} videos)`,
  }
})
