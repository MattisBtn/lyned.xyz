<template>
  <div
    class="absolute group"
    :class="isDragging ? 'z-20 cursor-grabbing' : 'cursor-pointer'"
    :style="{ left: `${cardX}px`, top: `${cardY}px`, width: `${project.width}px` }"
    role="button"
    :tabindex="visible ? 0 : -1"
    :aria-label="`View ${project.title}`"
    @pointerdown.stop="onPointerDown"
    @keydown.enter="openModal"
    @keydown.space.prevent="openModal"
  >
    <!-- Card frame -->
    <div
      class="relative border border-white/10 bg-black/30 hover:border-white/25 hover:shadow-[0_0_20px_rgba(255,255,255,0.06)] focus-within:border-white/25 card-clip"
      :class="isDragging ? 'border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'transition-all duration-300'"
    >

      <!-- Scan line overlay -->
      <div class="absolute inset-0 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 scan-lines" />

      <!-- Corner markers -->
      <div class="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20 z-10" />
      <div class="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/20 z-10" />
      <div class="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/20 z-10" />
      <div class="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20 z-10" />

      <!-- Media -->
      <div class="overflow-hidden relative" :style="{ height: `${project.height}px` }">
        <!-- Video: thumbnail fallback + lazy video -->
        <template v-if="project.type === 'video'">
          <img
            v-if="visible"
            :src="project.thumbnail"
            :alt="project.title"
            loading="lazy"
            class="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable="false"
          />
          <video
            v-if="showVideo"
            ref="videoEl"
            :src="project.src"
            muted
            autoplay
            loop
            playsinline
            class="relative w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-[1.03]"
            @loadeddata="onVideoReady"
            style="opacity: 0; transition: opacity 0.4s ease"
          />
        </template>
        <!-- Image: single img, no double load -->
        <img
          v-else-if="visible"
          :src="project.src"
          :alt="project.title"
          loading="lazy"
          class="w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-[1.03]"
          draggable="false"
        />
      </div>

      <!-- Info bar -->
      <div class="border-t border-white/10 bg-black/50 px-3 py-2 flex items-center justify-between gap-3">
        <span class="font-sans text-[10px] text-white/80 uppercase tracking-[0.15em] truncate">{{ project.title }}</span>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="font-sans text-[9px] text-white/50 uppercase">{{ project.type === 'video' ? 'MP4' : 'PNG' }}</span>
          <div class="w-1.5 h-1.5 rounded-full" :class="project.type === 'video' ? 'bg-emerald-400' : 'bg-white/40'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/data/projects'

const props = defineProps<{ project: Project, visible: boolean }>()
const emit = defineEmits<{ open: [project: Project] }>()

const sound = useSound()
const videoEl = ref<HTMLVideoElement | null>(null)
const showVideo = ref(false)
let unloadTimer: ReturnType<typeof setTimeout> | null = null

// --- Draggable position ---
const offsetX = ref(0)
const offsetY = ref(0)
const isDragging = ref(false)
const cardX = computed(() => props.project.x + offsetX.value)
const cardY = computed(() => props.project.y + offsetY.value)

const CLICK_THRESHOLD = 5
let dragStartX = 0
let dragStartY = 0
let dragStartOffX = 0
let dragStartOffY = 0
let dragDist = 0

function onPointerDown(e: PointerEvent) {
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  dragDist = 0
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragStartOffX = offsetX.value
  dragStartOffY = offsetY.value

  const el = e.currentTarget as HTMLElement

  const onMove = (ev: PointerEvent) => {
    const dx = ev.clientX - dragStartX
    const dy = ev.clientY - dragStartY
    dragDist = Math.sqrt(dx * dx + dy * dy)
    if (dragDist > CLICK_THRESHOLD) {
      isDragging.value = true
      offsetX.value = dragStartOffX + dx
      offsetY.value = dragStartOffY + dy
    }
  }

  const onUp = () => {
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', onUp)
    if (dragDist < CLICK_THRESHOLD) {
      openModal()
    }
    isDragging.value = false
  }

  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
}

function openModal() {
  sound.click()
  emit('open', props.project)
}

// --- Video lifecycle ---
watch(() => props.visible, (visible) => {
  if (props.project.type !== 'video') return
  if (visible) {
    if (unloadTimer) { clearTimeout(unloadTimer); unloadTimer = null }
    if (!showVideo.value) {
      showVideo.value = true
    } else {
      nextTick(() => videoEl.value?.play().catch(() => {}))
    }
  } else {
    videoEl.value?.pause()
    unloadTimer = setTimeout(() => {
      showVideo.value = false
      unloadTimer = null
    }, 10000)
  }
}, { immediate: true })

function onVideoReady(e: Event) {
  (e.target as HTMLVideoElement).style.opacity = '1'
}

onUnmounted(() => {
  if (unloadTimer) clearTimeout(unloadTimer)
})
</script>

<style scoped>
.card-clip {
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
}

.scan-lines {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.015) 2px,
    rgba(255, 255, 255, 0.015) 4px
  );
}
</style>
