#!/usr/bin/env node

/**
 * Asset Ingestion Pipeline
 *
 * Usage: npm run ingest
 *
 * 1. Scans public/assets/raw/ for images (png, jpg, jpeg) and videos (mp4, mkv, mov)
 * 2. Compresses images → WebP in public/assets/graphic/
 * 3. Compresses videos → H.264 MP4 in public/assets/motion/
 * 4. Extracts video thumbnails → WebP in public/assets/motion/thumbs/
 * 5. Computes grid+noise positions for all projects
 * 6. Generates app/data/projects.ts
 */

import { execSync } from 'child_process'
import { readdirSync, existsSync, mkdirSync, writeFileSync, statSync, unlinkSync } from 'fs'
import { join, basename, extname } from 'path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const RAW_DIR = join(ROOT, 'public/assets/raw')
const GRAPHIC_DIR = join(ROOT, 'public/assets/graphic')
const MOTION_DIR = join(ROOT, 'public/assets/motion')
const THUMBS_DIR = join(ROOT, 'public/assets/motion/thumbs')
const OUTPUT_TS = join(ROOT, 'app/data/projects.ts')

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp']
const VIDEO_EXTS = ['.mp4', '.mkv', '.mov']

// --- Tools ---
const MAGICK = 'magick'
const FFMPEG_PATH = join(ROOT, 'node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe')
const FFMPEG = existsSync(FFMPEG_PATH) ? FFMPEG_PATH : 'ffmpeg'

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[éèê]/g, 'e')
    .replace(/[àâ]/g, 'a')
    .replace(/[ùû]/g, 'u')
    .replace(/[ôö]/g, 'o')
    .replace(/[îï]/g, 'i')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\-_.]/g, '')
}

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

// --- Ensure directories ---
for (const dir of [RAW_DIR, GRAPHIC_DIR, MOTION_DIR, THUMBS_DIR]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

// --- Scan raw files ---
const rawFiles = readdirSync(RAW_DIR).filter(f => {
  const ext = extname(f).toLowerCase()
  return IMAGE_EXTS.includes(ext) || VIDEO_EXTS.includes(ext)
})

if (rawFiles.length === 0) {
  console.log('No new files in public/assets/raw/. Scanning existing assets...')
}

// --- Process new raw files ---
const newImages = []
const newVideos = []

for (const file of rawFiles) {
  const ext = extname(file).toLowerCase()
  const name = basename(file, extname(file))
  const slug = slugify(name)

  if (IMAGE_EXTS.includes(ext)) {
    const src = join(RAW_DIR, file)
    const dst = join(GRAPHIC_DIR, `${slug}.webp`)
    if (!existsSync(dst)) {
      console.log(`[IMG] ${file} → ${slug}.webp`)
      run(`"${MAGICK}" "${src}" -quality 90 -define webp:method=6 "${dst}"`)
    }
    newImages.push(slug)
  } else if (VIDEO_EXTS.includes(ext)) {
    const src = join(RAW_DIR, file)
    const dst = join(MOTION_DIR, `${slug}.mp4`)
    const thumb = join(THUMBS_DIR, `${slug}.webp`)

    if (!existsSync(dst)) {
      console.log(`[VID] ${file} → ${slug}.mp4`)
      const ok = run(`"${FFMPEG}" -y -i "${src}" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart -pix_fmt yuv420p "${dst}"`)
      if (!ok) {
        console.error(`  FAILED: ${file}`)
        continue
      }
      // Check if compressed is bigger than original → copy original
      const origSize = statSync(src).size
      const newSize = statSync(dst).size
      if (newSize > origSize) {
        console.log(`  (compressed bigger, copying original)`)
        execSync(`cp "${src}" "${dst}"`)
      }
    }

    if (!existsSync(thumb)) {
      console.log(`[THB] ${slug}.mp4 → thumb`)
      const tmpPng = join(THUMBS_DIR, `${slug}-tmp.png`)
      run(`"${FFMPEG}" -y -ss 1 -i "${dst}" -frames:v 1 "${tmpPng}"`) ||
        run(`"${FFMPEG}" -y -ss 0 -i "${dst}" -frames:v 1 "${tmpPng}"`)
      if (existsSync(tmpPng)) {
        run(`"${MAGICK}" "${tmpPng}" -quality 85 "${thumb}"`)
        execSync(`rm -f "${tmpPng}"`)
      }
    }
    newVideos.push(slug)
  }
}

if (rawFiles.length > 0) {
  console.log(`\nProcessed: ${newImages.length} images, ${newVideos.length} videos`)

  // Clean up raw files after successful processing
  for (const file of rawFiles) {
    const src = join(RAW_DIR, file)
    try {
      unlinkSync(src)
      console.log(`[CLN] Removed raw: ${file}`)
    } catch {}
  }
}

// --- Scan all existing assets to build project list ---
const allGraphic = readdirSync(GRAPHIC_DIR)
  .filter(f => f.endsWith('.webp'))
  .map(f => ({ slug: basename(f, '.webp'), file: f }))

const allMotion = readdirSync(MOTION_DIR)
  .filter(f => f.endsWith('.mp4'))
  .map(f => ({ slug: basename(f, '.mp4'), file: f }))

const allProjects = [
  ...allGraphic.map(g => ({
    id: g.slug,
    title: g.slug.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    type: 'image',
    src: `/assets/graphic/${g.file}`,
    thumbnail: `/assets/graphic/${g.file}`,
  })),
  ...allMotion.map(v => {
    const thumbFile = `${v.slug}.webp`
    const thumbExists = existsSync(join(THUMBS_DIR, thumbFile))
    return {
      id: v.slug,
      title: v.slug.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      type: 'video',
      src: `/assets/motion/${v.file}`,
      thumbnail: thumbExists
        ? `/assets/motion/thumbs/${thumbFile}`
        : `/assets/graphic/${allGraphic[0]?.file || 'placeholder.webp'}`,
    }
  }),
]

// --- Organic placement: pack items tightly with no overlap ---

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rand = seededRandom(42)

// Assign sizes
const sized = allProjects.map(project => {
  const widthVariants = [260, 280, 300, 320, 340]
  const w = widthVariants[Math.floor(rand() * widthVariants.length)]
  const h = project.type === 'video'
    ? Math.round(w * (9 / 16) + (rand() - 0.5) * 20)
    : Math.round(w * (0.7 + rand() * 0.4))
  return { ...project, width: w, height: Math.max(150, h) + 40 } // +40 for info bar
})

// Shuffle for variety (seeded)
const shuffled = [...sized]
for (let i = shuffled.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1))
  ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
}

const GAP = 160         // breathing room between cards
const CANVAS_W = 4500   // target canvas width (wider = more airy)
const MARGIN = 150      // edge margin

/**
 * Place each item by scanning candidate positions and picking the one
 * that is closest to top-left while avoiding all placed items.
 * Candidates come from edges of already-placed items (right edge, bottom edge).
 */
const placed = []

function overlaps(rect) {
  for (const p of placed) {
    if (
      rect.x < p.x + p.width + GAP &&
      rect.x + rect.width + GAP > p.x &&
      rect.y < p.y + p.height + GAP &&
      rect.y + rect.height + GAP > p.y
    ) return true
  }
  return false
}

for (const item of shuffled) {
  // Build candidate positions from edges of placed items
  const candidates = [{ x: MARGIN, y: MARGIN }]

  for (const p of placed) {
    // Variable extra spacing (0-80px) for airy, organic feel
    const extraX = Math.round(rand() * 200)
    const extraY = Math.round(rand() * 200)
    // Right of placed item
    candidates.push({ x: p.x + p.width + GAP + extraX, y: p.y })
    // Below placed item
    candidates.push({ x: p.x, y: p.y + p.height + GAP + extraY })
    // Staggered offset (breaks grid alignment)
    candidates.push({ x: p.x + p.width + GAP + extraX, y: p.y + Math.round(p.height * 0.3) })
    candidates.push({ x: p.x + Math.round(p.width * 0.4), y: p.y + p.height + GAP + extraY })
  }

  // Filter: must fit in canvas width, must not overlap
  const valid = candidates
    .filter(c => c.x + item.width <= CANVAS_W && c.x >= MARGIN && c.y >= MARGIN)
    .filter(c => !overlaps({ ...item, x: c.x, y: c.y }))

  // Pick the one closest to top-left (pack tightly)
  valid.sort((a, b) => {
    const scoreA = a.y * 2 + a.x  // favor top, then left
    const scoreB = b.y * 2 + b.x
    return scoreA - scoreB
  })

  const pos = valid[0] || { x: MARGIN, y: (placed[placed.length - 1]?.y ?? 0) + 400 }

  // Noise for organic feel
  const noiseMax = Math.floor(GAP * 0.35)
  const nx = Math.round((rand() - 0.5) * noiseMax * 2)
  const ny = Math.round((rand() - 0.5) * noiseMax * 2)
  const finalX = Math.max(MARGIN, pos.x + nx)
  const finalY = Math.max(MARGIN, pos.y + ny)

  // Verify noise didn't cause overlap, fallback to original pos
  const noisy = { ...item, x: finalX, y: finalY }
  const useNoisy = !overlaps(noisy) && finalX + item.width <= CANVAS_W

  placed.push({
    ...item,
    x: useNoisy ? finalX : pos.x,
    y: useNoisy ? finalY : pos.y,
  })
}

const positioned = placed

// --- Generate projects.ts ---
const tsContent = `export interface Project {
  id: string
  title: string
  type: 'image' | 'video'
  src: string
  thumbnail: string
  x: number
  y: number
  width: number
  height: number
}

// Auto-generated by scripts/ingest.mjs — do not edit manually
export const projects: Project[] = ${JSON.stringify(positioned, null, 2)}
`

writeFileSync(OUTPUT_TS, tsContent, 'utf-8')
console.log(`\nGenerated ${OUTPUT_TS} with ${positioned.length} projects (${allGraphic.length} images, ${allMotion.length} videos)`)
console.log('Done!')
