<template>
  <div
    class="absolute group"
    :style="{ left: `${project.x}px`, top: `${project.y}px`, width: `${project.width}px` }"
    role="button"
    :tabindex="visible ? 0 : -1"
    :aria-label="`View ${project.title}`"
    @pointerup="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Card frame -->
    <div class="relative border border-white/[0.06] bg-white/[0.02] transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.04)] focus-within:border-white/20 card-clip">

      <!-- Scan line overlay -->
      <div class="absolute inset-0 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 scan-lines" />

      <!-- Corner markers -->
      <div class="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20 z-10" />
      <div class="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/20 z-10" />
      <div class="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/20 z-10" />
      <div class="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20 z-10" />

      <!-- Media -->
      <div class="overflow-hidden relative" :style="{ height: `${project.height}px` }">
        <!-- Thumbnail fallback -->
        <img
          v-if="visible"
          :src="project.thumbnail"
          :alt="project.title"
          loading="lazy"
          class="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable="false"
        />

        <!-- Video: lazy loaded, unloaded when off-screen for 10s -->
        <video
          v-if="project.type === 'video' && showVideo"
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

        <!-- Image -->
        <img
          v-else-if="project.type === 'image' && visible"
          :src="project.src"
          :alt="project.title"
          loading="lazy"
          class="relative w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-[1.03]"
          draggable="false"
        />
      </div>

      <!-- Info bar -->
      <div class="border-t border-white/[0.06] px-3 py-2 flex items-center justify-between gap-3">
        <span class="font-sans text-[10px] text-white/50 uppercase tracking-[0.15em] truncate">{{ project.title }}</span>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="font-sans text-[9px] text-white/30 uppercase">{{ project.type === 'video' ? 'MP4' : 'PNG' }}</span>
          <div class="w-1.5 h-1.5 rounded-full" :class="project.type === 'video' ? 'bg-emerald-400/80' : 'bg-white/30'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/data/projects'

const props = defineProps<{ project: Project, visible: boolean }>()
const emit = defineEmits<{ open: [project: Project] }>()

const wasClick = inject<() => boolean>('wasClick', () => true)
const sound = useSound()
const videoEl = ref<HTMLVideoElement | null>(null)
const showVideo = ref(false)
let unloadTimer: ReturnType<typeof setTimeout> | null = null

// Unified visibility watcher: load/unload video, play/pause
watch(() => props.visible, (visible) => {
  if (props.project.type !== 'video') return

  if (visible) {
    // Cancel pending unload
    if (unloadTimer) { clearTimeout(unloadTimer); unloadTimer = null }

    if (!showVideo.value) {
      // First time visible: mount the video
      showVideo.value = true
    } else {
      // Already mounted: resume
      nextTick(() => videoEl.value?.play().catch(() => {}))
    }
  } else {
    // Pause immediately
    videoEl.value?.pause()

    // Unload after 10s of being off-screen
    unloadTimer = setTimeout(() => {
      showVideo.value = false
      unloadTimer = null
    }, 10000)
  }
})

function onVideoReady(e: Event) {
  (e.target as HTMLVideoElement).style.opacity = '1'
}

function handleClick() {
  if (wasClick()) {
    sound.click()
    emit('open', props.project)
  }
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
