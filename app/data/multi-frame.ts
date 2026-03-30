export interface MultiFrameCell {
  x: number
  y: number
  w: number
  h: number
  cropX: number // object-position X (0-1)
  cropY: number // object-position Y (0-1)
  zoom: number  // scale factor (1 = normal)
}

// 6-frame asymmetric preset — based on reference layout
// Coordinates relative to cluster anchor (top-left of bounding box)
// h = media height only (info bar adds ~36px per frame)
// Cluster bounding box: 880w x 660h
export const MULTI_FRAME_PRESET: MultiFrameCell[] = [
  { x: 0,   y: 0,   w: 320, h: 170, cropX: 0.2, cropY: 0.3, zoom: 1.2 },  // top-left medium (total: 206)
  { x: 290, y: 15,  w: 430, h: 230, cropX: 0.5, cropY: 0.5, zoom: 1.0 },  // top-right hero (total: 281)
  { x: 690, y: 0,   w: 190, h: 120, cropX: 0.8, cropY: 0.2, zoom: 1.8 },  // small top-right corner (total: 156)
  { x: 0,   y: 230, w: 240, h: 140, cropX: 0.3, cropY: 0.6, zoom: 1.4 },  // left-center (total: 406)
  { x: 100, y: 420, w: 520, h: 170, cropX: 0.5, cropY: 0.7, zoom: 1.1 },  // bottom wide (total: 626)
  { x: 0,   y: 430, w: 190, h: 110, cropX: 0.1, cropY: 0.8, zoom: 1.6 },  // bottom-left small (total: 576)
]

export const MULTI_FRAME_BOUNDS = { width: 880, height: 660 }

// Compute bounding box from frames (accounts for info bar height ~36px)
const INFO_BAR_H = 36
export function computeBounds(frames: MultiFrameCell[]) {
  let maxX = 0, maxY = 0
  for (const f of frames) {
    maxX = Math.max(maxX, f.x + f.w)
    maxY = Math.max(maxY, f.y + f.h + INFO_BAR_H)
  }
  return { width: maxX, height: maxY }
}

// Shared reactive preset — loaded once from API, fallback to hardcoded
const loadedPreset = ref<MultiFrameCell[] | null>(null)
const loadedBounds = ref(MULTI_FRAME_BOUNDS)
let fetched = false

export function useMultiFramePreset() {
  if (import.meta.client && !fetched) {
    fetched = true
    $fetch<{ frames: MultiFrameCell[] } | null>('/api/multi-frame-preset')
      .then((data) => {
        if (data?.frames?.length === 6) {
          loadedPreset.value = data.frames
          loadedBounds.value = computeBounds(data.frames)
        }
      })
      .catch(() => { /* use fallback */ })
  }

  const frames = computed(() => loadedPreset.value || MULTI_FRAME_PRESET)
  const bounds = computed(() => loadedPreset.value ? loadedBounds.value : MULTI_FRAME_BOUNDS)

  function refresh() {
    if (!import.meta.client) return
    $fetch<{ frames: MultiFrameCell[] } | null>('/api/multi-frame-preset')
      .then((data) => {
        if (data?.frames?.length === 6) {
          loadedPreset.value = data.frames
          loadedBounds.value = computeBounds(data.frames)
        }
      })
      .catch(() => { /* keep current */ })
  }

  return { frames, bounds, refresh }
}
