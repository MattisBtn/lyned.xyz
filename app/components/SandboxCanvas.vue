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

// --- Smooth drag with momentum (M1: non-reactive animation vars) ---
// Raw JS vars for animation — no Vue reactivity overhead per frame
let _targetX = 0, _targetY = 0
let _smoothX = 0, _smoothY = 0
let _velX = 0, _velY = 0
let _dragStartX = 0, _dragStartY = 0
let _dragStartOffX = 0, _dragStartOffY = 0
let _lastPtrX = 0, _lastPtrY = 0, _lastPtrTime = 0

const isDragging = ref(false)
const dragDistance = ref(0)

const CLICK_THRESHOLD = 5
const FRICTION = 0.92
const LERP = 0.15
const MIN_VELOCITY = 0.1
const CONVERGE_THRESHOLD = 0.5

let raf: number | null = null
const viewW = ref(0)
const viewH = ref(0)

// Reactive output — only updated when tiles actually change
const renderedOffset = reactive({ x: 0, y: 0 })

function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

const baseX = computed(() => -mod(-renderedOffset.x, canvasW.value))
const baseY = computed(() => -mod(-renderedOffset.y, canvasH.value))

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
      if (tx + w < -PADDING || tx > vw + PADDING) continue
      if (ty + h < -PADDING || ty > vh + PADDING) continue
      result.push({ key: `${gx}_${gy}`, tx, ty })
    }
  }
  return result
})

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

// Animation loop — updates raw vars, syncs to reactive only when needed
function animate() {
  if (isDragging.value) {
    _smoothX += (_targetX - _smoothX) * LERP
    _smoothY += (_targetY - _smoothY) * LERP
  } else {
    if (Math.abs(_velX) > MIN_VELOCITY || Math.abs(_velY) > MIN_VELOCITY) {
      _targetX += _velX
      _targetY += _velY
      _velX *= FRICTION
      _velY *= FRICTION
    }
    _smoothX += (_targetX - _smoothX) * LERP
    _smoothY += (_targetY - _smoothY) * LERP

    const dx = Math.abs(_targetX - _smoothX)
    const dy = Math.abs(_targetY - _smoothY)
    if (dx < CONVERGE_THRESHOLD && dy < CONVERGE_THRESHOLD && Math.abs(_velX) < MIN_VELOCITY && Math.abs(_velY) < MIN_VELOCITY) {
      _smoothX = _targetX
      _smoothY = _targetY
      renderedOffset.x = _smoothX
      renderedOffset.y = _smoothY
      raf = null
      return
    }
  }

  // Sync to reactive state (triggers Vue recomputation)
  renderedOffset.x = _smoothX
  renderedOffset.y = _smoothY

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
  _velX = 0
  _velY = 0
  _dragStartX = e.clientX
  _dragStartY = e.clientY
  _dragStartOffX = _targetX
  _dragStartOffY = _targetY
  _lastPtrX = e.clientX
  _lastPtrY = e.clientY
  _lastPtrTime = performance.now()
  ensureAnimating()
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  const dx = e.clientX - _dragStartX
  const dy = e.clientY - _dragStartY
  dragDistance.value = Math.sqrt(dx * dx + dy * dy)
  _targetX = _dragStartOffX + dx
  _targetY = _dragStartOffY + dy
  const now = performance.now()
  const dt = now - _lastPtrTime
  if (dt > 0) {
    _velX = (e.clientX - _lastPtrX) / dt * 16
    _velY = (e.clientY - _lastPtrY) / dt * 16
  }
  _lastPtrX = e.clientX
  _lastPtrY = e.clientY
  _lastPtrTime = now
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
