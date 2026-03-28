<template>
  <div
    ref="viewport"
    class="fixed inset-0 z-10 overflow-hidden select-none touch-none"
    :class="[isDragging ? 'cursor-grabbing' : 'cursor-grab', { 'pointer-events-none': disabled }]"
    aria-label="Project gallery — drag to navigate"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointerleave="onPointerUp"
  >
    <template v-for="tile in activeTiles" :key="tile.key">
      <div
        class="absolute will-change-transform"
        :style="{ transform: `translate(${tile.tx}px, ${tile.ty}px)` }"
      >
        <slot :is-visible="(p: any) => isCardVisibleInTile(p, tile)" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/data/projects'

const props = defineProps<{ disabled?: boolean, projects: Project[] }>()

// --- Canvas size from project bounds ---
const PADDING = 100
const canvasW = computed(() => {
  let max = 0
  for (const p of props.projects) {
    const r = p.x + p.width + PADDING
    if (r > max) max = r
  }
  return Math.max(max, 800)
})
const canvasH = computed(() => {
  let max = 0
  for (const p of props.projects) {
    const b = p.y + p.height + PADDING
    if (b > max) max = b
  }
  return Math.max(max, 600)
})

// --- Smooth drag with momentum ---
const targetOffset = reactive({ x: 0, y: 0 })
const smoothOffset = reactive({ x: 0, y: 0 })
const velocity = reactive({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = reactive({ x: 0, y: 0 })
const dragStartOffset = reactive({ x: 0, y: 0 })
const dragDistance = ref(0)
const lastPointer = reactive({ x: 0, y: 0, time: 0 })

const CLICK_THRESHOLD = 5
const FRICTION = 0.92
const LERP = 0.15
const MIN_VELOCITY = 0.1
const CONVERGE_THRESHOLD = 0.5

let raf: number | null = null
const viewW = ref(0)
const viewH = ref(0)

function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

const baseX = computed(() => -mod(-smoothOffset.x, canvasW.value))
const baseY = computed(() => -mod(-smoothOffset.y, canvasH.value))

// Only render tiles that actually overlap the viewport (typically 1-4)
const activeTiles = computed(() => {
  const w = canvasW.value
  const h = canvasH.value
  const bx = baseX.value
  const by = baseY.value
  const vw = viewW.value
  const vh = viewH.value
  const result: { key: string, tx: number, ty: number }[] = []
  for (let gy = -1; gy <= 1; gy++) {
    for (let gx = -1; gx <= 1; gx++) {
      const tx = bx + gx * w
      const ty = by + gy * h
      // Skip tiles fully off-screen
      if (tx + w < -PADDING || tx > vw + PADDING) continue
      if (ty + h < -PADDING || ty > vh + PADDING) continue
      result.push({ key: `${gx}_${gy}`, tx, ty })
    }
  }
  return result
})

// --- Visibility check for lazy loading ---
function isCardVisibleInTile(
  project: { x: number, y: number, width: number, height: number },
  tile: { tx: number, ty: number },
) {
  const margin = 300
  const l = tile.tx + project.x
  const t = tile.ty + project.y
  return (
    l + project.width > -margin &&
    l < viewW.value + margin &&
    t + project.height > -margin &&
    t < viewH.value + margin
  )
}

// --- Animation loop (starts/stops as needed) ---
function animate() {
  if (isDragging.value) {
    smoothOffset.x += (targetOffset.x - smoothOffset.x) * LERP
    smoothOffset.y += (targetOffset.y - smoothOffset.y) * LERP
  } else {
    if (Math.abs(velocity.x) > MIN_VELOCITY || Math.abs(velocity.y) > MIN_VELOCITY) {
      targetOffset.x += velocity.x
      targetOffset.y += velocity.y
      velocity.x *= FRICTION
      velocity.y *= FRICTION
    }
    smoothOffset.x += (targetOffset.x - smoothOffset.x) * LERP
    smoothOffset.y += (targetOffset.y - smoothOffset.y) * LERP

    // Stop loop when fully converged
    const dx = Math.abs(targetOffset.x - smoothOffset.x)
    const dy = Math.abs(targetOffset.y - smoothOffset.y)
    if (dx < CONVERGE_THRESHOLD && dy < CONVERGE_THRESHOLD && Math.abs(velocity.x) < MIN_VELOCITY && Math.abs(velocity.y) < MIN_VELOCITY) {
      smoothOffset.x = targetOffset.x
      smoothOffset.y = targetOffset.y
      raf = null
      return
    }
  }
  raf = requestAnimationFrame(animate)
}

function ensureAnimating() {
  if (raf === null) {
    raf = requestAnimationFrame(animate)
  }
}

// --- Unified pointer events (mouse + touch) ---
function onPointerDown(e: PointerEvent) {
  if (props.disabled) return
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  isDragging.value = true
  dragDistance.value = 0
  velocity.x = 0
  velocity.y = 0
  dragStart.x = e.clientX
  dragStart.y = e.clientY
  dragStartOffset.x = targetOffset.x
  dragStartOffset.y = targetOffset.y
  lastPointer.x = e.clientX
  lastPointer.y = e.clientY
  lastPointer.time = performance.now()
  ensureAnimating()
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  const dx = e.clientX - dragStart.x
  const dy = e.clientY - dragStart.y
  dragDistance.value = Math.sqrt(dx * dx + dy * dy)
  targetOffset.x = dragStartOffset.x + dx
  targetOffset.y = dragStartOffset.y + dy
  const now = performance.now()
  const dt = now - lastPointer.time
  if (dt > 0) {
    velocity.x = (e.clientX - lastPointer.x) / dt * 16
    velocity.y = (e.clientY - lastPointer.y) / dt * 16
  }
  lastPointer.x = e.clientX
  lastPointer.y = e.clientY
  lastPointer.time = now
}

function onPointerUp() {
  isDragging.value = false
}

function wasClick() {
  return dragDistance.value < CLICK_THRESHOLD
}

provide('wasClick', wasClick)

function onResize() {
  viewW.value = window.innerWidth
  viewH.value = window.innerHeight
}

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
  ensureAnimating()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  if (raf !== null) cancelAnimationFrame(raf)
})
</script>
