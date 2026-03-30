<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        @click.self="$emit('close')"
        @keydown.escape="$emit('close')"
      >
        <div class="relative border border-white/[0.08] bg-[#0a0a0f] backdrop-blur-md clip-lg shadow-[0_0_60px_rgba(0,0,0,0.6)] w-full max-w-5xl mx-4 max-h-[90vh] overflow-auto">
          <!-- Corner brackets -->
          <div class="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 border-white/25" />
          <div class="absolute -top-px -right-px w-5 h-5 border-t-2 border-r-2 border-white/25" />
          <div class="absolute -bottom-px -left-px w-5 h-5 border-b-2 border-l-2 border-white/25" />
          <div class="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 border-white/25" />

          <!-- Top bar -->
          <div class="border-b border-white/[0.06] px-5 py-3 flex items-center justify-between sticky top-0 bg-[#0a0a0f] z-20">
            <div class="flex items-center gap-3">
              <div class="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span class="text-[11px] text-white/60 uppercase tracking-[0.12em]">Multi-Frame Layout Editor</span>
            </div>
            <button
              type="button"
              class="text-[10px] text-white/30 uppercase tracking-[0.15em] hover:text-white/70 transition-colors cursor-pointer"
              @click="$emit('close')"
            >
              [ESC]
            </button>
          </div>

          <div class="flex flex-col lg:flex-row">
            <!-- Preview panel -->
            <div class="flex-1 p-5 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
              <div class="text-[9px] text-white/25 uppercase tracking-[0.2em] mb-3">Preview</div>
              <div
                class="relative bg-black/40 border border-white/[0.06] mx-auto overflow-hidden"
                :style="{ width: `${previewW}px`, height: `${previewH}px` }"
              >
                <!-- SVG clip-path for thumbnail (matches cluster rendering) -->
                <svg class="absolute" width="0" height="0" aria-hidden="true">
                  <defs>
                    <clipPath id="editor-preview-clip" :clipPathUnits="'userSpaceOnUse'">
                      <rect
                        v-for="(frame, i) in localFrames"
                        :key="i"
                        :x="frame.x * scale"
                        :y="frame.y * scale"
                        :width="frame.w * scale"
                        :height="frame.h * scale"
                      />
                    </clipPath>
                  </defs>
                </svg>

                <!-- Thumbnail clipped to frame areas (same as real cluster) -->
                <img
                  v-if="previewThumb"
                  :src="previewThumb"
                  class="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  style="clip-path: url(#editor-preview-clip);"
                  draggable="false"
                />

                <!-- Frame overlays (borders, selection, drag) -->
                <div
                  v-for="(frame, i) in localFrames"
                  :key="'frame-' + i"
                  class="absolute border cursor-pointer transition-all duration-150 frame-clip"
                  :class="[
                    selectedIdx === i ? 'border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.15)]' : 'border-white/15 hover:border-white/25',
                    draggingIdx === i ? 'z-10 cursor-grabbing' : 'cursor-grab',
                  ]"
                  :style="{
                    left: `${frame.x * scale}px`,
                    top: `${frame.y * scale}px`,
                    width: `${frame.w * scale}px`,
                    height: `${(frame.h + 36) * scale}px`,
                  }"
                  @pointerdown.stop="onFramePointerDown($event, i)"
                >
                  <!-- Transparent media area (thumbnail shows through from behind) -->
                  <div :style="{ height: `${frame.h * scale}px` }" />
                  <!-- Mini info bar -->
                  <div class="bg-black/50 px-1 flex items-center justify-between" :style="{ height: `${36 * scale}px` }">
                    <span class="text-white/50 uppercase truncate" :style="{ fontSize: `${Math.max(6, 10 * scale)}px` }">{{ i + 1 }}</span>
                  </div>
                </div>

                <!-- Bounding box indicator -->
                <div class="absolute inset-0 border border-dashed border-white/[0.06] pointer-events-none" />
              </div>
              <div class="mt-2 text-[8px] text-white/15 text-center">
                Bounding box: {{ computedBounds.width }}x{{ computedBounds.height }}px — Click to select, drag to move
              </div>
            </div>

            <!-- Edit panel -->
            <div class="w-full lg:w-80 p-5">
              <div class="text-[9px] text-white/25 uppercase tracking-[0.2em] mb-3">
                Frame {{ selectedIdx + 1 }} of 6
              </div>

              <div v-if="selected" class="space-y-3">
                <!-- Position -->
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[8px] text-white/25 uppercase tracking-[0.2em] mb-1">X</label>
                    <input v-model.number="selected.x" type="number" class="field" />
                  </div>
                  <div>
                    <label class="block text-[8px] text-white/25 uppercase tracking-[0.2em] mb-1">Y</label>
                    <input v-model.number="selected.y" type="number" class="field" />
                  </div>
                </div>

                <!-- Size -->
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[8px] text-white/25 uppercase tracking-[0.2em] mb-1">Width</label>
                    <input v-model.number="selected.w" type="number" class="field" />
                  </div>
                  <div>
                    <label class="block text-[8px] text-white/25 uppercase tracking-[0.2em] mb-1">Height</label>
                    <input v-model.number="selected.h" type="number" class="field" />
                  </div>
                </div>

                <div class="mt-2 text-[8px] text-white/15 normal-case tracking-normal leading-relaxed">
                  Position determines which part of the video shows through. The video fills the entire cluster and each frame reveals its portion.
                </div>
              </div>

              <!-- Actions -->
              <div class="mt-6 space-y-2">
                <button
                  type="button"
                  class="w-full px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] border border-white/15 bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white/90 hover:border-white/25 transition-all clip-sm"
                  :class="saving ? 'opacity-50 pointer-events-none' : ''"
                  @click="save"
                >
                  {{ saving ? 'Saving...' : 'Save Preset' }}
                </button>
                <button
                  type="button"
                  class="w-full px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white/60 transition-colors"
                  @click="reset"
                >
                  Reset to Default
                </button>
              </div>

              <Transition name="fade">
                <p v-if="saveStatus" class="mt-2 text-[9px] uppercase tracking-[0.15em]" :class="saveStatus === 'Saved' ? 'text-emerald-400/70' : 'text-red-400/70'">
                  {{ saveStatus }}
                </p>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { MultiFrameCell } from '~/data/multi-frame'
import { MULTI_FRAME_PRESET, computeBounds, useMultiFramePreset } from '~/data/multi-frame'

const props = defineProps<{
  open: boolean
  previewThumb: string | null
  token: string
}>()
defineEmits<{ close: [] }>()

const { refresh: refreshPreset } = useMultiFramePreset()
const selectedIdx = ref(0)
const draggingIdx = ref(-1)
const saving = ref(false)
const saveStatus = ref('')

// Deep clone the preset for editing
const localFrames = reactive<MultiFrameCell[]>(
  JSON.parse(JSON.stringify(MULTI_FRAME_PRESET))
)

const selected = computed(() => localFrames[selectedIdx.value])

const computedBounds = computed(() => computeBounds(localFrames))

// Preview scaling — fit into ~500px width
const scale = computed(() => {
  const { width, height } = computedBounds.value
  if (width < 1 || height < 1) return 0.5
  return Math.min(500 / width, 400 / height)
})
const previewW = computed(() => Math.round(computedBounds.value.width * scale.value))
const previewH = computed(() => Math.round(computedBounds.value.height * scale.value))

// Load current preset from API
watch(() => props.open, async (open) => {
  if (!open) return
  saveStatus.value = ''
  try {
    const data = await $fetch<{ frames: MultiFrameCell[] } | null>('/api/multi-frame-preset')
    if (data?.frames?.length === 6) {
      for (let i = 0; i < 6; i++) Object.assign(localFrames[i], data.frames[i])
    }
  } catch { /* use current values */ }
})

// Drag-to-move frames in preview
const CLICK_THRESHOLD = 3
function onFramePointerDown(e: PointerEvent, idx: number) {
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)

  const startX = e.clientX
  const startY = e.clientY
  const startFrameX = localFrames[idx].x
  const startFrameY = localFrames[idx].y
  let dist = 0

  const onMove = (ev: PointerEvent) => {
    const dx = ev.clientX - startX
    const dy = ev.clientY - startY
    dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > CLICK_THRESHOLD) {
      draggingIdx.value = idx
      localFrames[idx].x = Math.max(0, Math.round(startFrameX + dx / scale.value))
      localFrames[idx].y = Math.max(0, Math.round(startFrameY + dy / scale.value))
    }
  }

  const onUp = () => {
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('pointercancel', onUp)
    if (dist <= CLICK_THRESHOLD) {
      selectedIdx.value = idx
    }
    draggingIdx.value = -1
  }

  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)
}

function reset() {
  const defaults = JSON.parse(JSON.stringify(MULTI_FRAME_PRESET))
  for (let i = 0; i < 6; i++) Object.assign(localFrames[i], defaults[i])
  saveStatus.value = ''
}

async function save() {
  saving.value = true
  saveStatus.value = ''
  try {
    await $fetch('/api/admin/multi-frame-preset', {
      method: 'POST',
      body: { frames: localFrames },
      headers: props.token ? { 'x-admin-token': props.token } : {},
    })
    saveStatus.value = 'Saved'
    refreshPreset()
  } catch {
    saveStatus.value = 'Save failed'
  }
  saving.value = false
}
</script>

<style scoped>
.clip-lg {
  clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
}
.clip-sm {
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}
.frame-clip {
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
}

.field {
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 6px 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  outline: none;
  font-variant-numeric: tabular-nums;
  transition: border-color 0.15s;
}
.field:focus {
  border-color: rgba(255, 255, 255, 0.25);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
