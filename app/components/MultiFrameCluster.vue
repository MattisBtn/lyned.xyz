<template>
  <div
    class="absolute"
    :style="{ left: `${project.x}px`, top: `${project.y}px`, width: `${bounds.width}px`, height: `${bounds.height}px` }"
  >
    <!-- SVG clip-path: video only visible through frame rectangles -->
    <svg class="absolute" width="0" height="0" aria-hidden="true">
      <defs>
        <clipPath :id="clipId">
          <rect
            v-for="(frame, i) in frames"
            :key="i"
            :x="frame.x"
            :y="frame.y"
            :width="frame.w"
            :height="frame.h"
          />
        </clipPath>
      </defs>
    </svg>

    <!-- Thumbnail fallback (clipped to frames) -->
    <img
      v-if="visible"
      :src="project.thumbnail"
      :alt="project.title"
      loading="lazy"
      draggable="false"
      class="absolute inset-0 w-full h-full object-cover pointer-events-none"
      :style="{ clipPath: `url(#${clipId})` }"
    />

    <!-- Video layer (clipped to same frames, fades in over thumbnail) -->
    <video
      v-if="showVideo && project.type === 'video'"
      ref="videoEl"
      :src="project.src"
      muted
      loop
      playsinline
      class="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-500"
      :style="{ clipPath: `url(#${clipId})`, opacity: videoReady ? '1' : '0' }"
      @canplay="onVideoReady"
    />

    <!-- Frame overlays (borders, corners, scan-lines, info bars) -->
    <div
      v-for="(frame, i) in frames"
      :key="'frame-' + i"
      class="absolute group/frame cursor-pointer"
      :style="{
        left: `${frame.x}px`,
        top: `${frame.y}px`,
        width: `${frame.w}px`,
      }"
      role="button"
      tabindex="0"
      @click="$emit('open', project)"
      @keydown.enter="$emit('open', project)"
    >
      <div class="relative border border-white/10 hover:border-white/25 hover:shadow-[0_0_20px_rgba(255,255,255,0.06)] transition-all duration-300 card-clip pointer-events-auto"
        :style="{ height: `${frame.h + 36}px` }"
      >
        <!-- Scan line overlay -->
        <div class="absolute inset-0 pointer-events-none z-10 opacity-0 group-hover/frame:opacity-100 transition-opacity duration-500 scan-lines" />

        <!-- Corner markers -->
        <div class="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20 z-10" />
        <div class="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/20 z-10" />
        <div class="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/20 z-10" />
        <div class="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20 z-10" />

        <!-- Transparent media area (video shows through from behind) -->
        <div :style="{ height: `${frame.h}px` }" />

        <!-- Info bar -->
        <div class="border-t border-white/10 bg-black/50 px-3 py-2">
          <div class="flex items-center justify-between gap-3">
            <span class="font-sans text-[10px] text-white/80 uppercase tracking-[0.15em] truncate">{{ project.title }}</span>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="font-sans text-[9px] text-white/50 uppercase">{{ project.type === 'video' ? 'MP4' : 'WEBP' }}</span>
              <div class="w-1.5 h-1.5 rounded-full" :class="project.type === 'video' ? 'bg-emerald-400' : 'bg-white/40'" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/data/projects'
import { useMultiFramePreset } from '~/data/multi-frame'

const props = defineProps<{ project: Project, visible: boolean }>()
defineEmits<{ open: [project: Project] }>()

const { frames, bounds } = useMultiFramePreset()

// Unique clip-path ID per project (avoids SVG ID collisions)
const clipId = computed(() => `mf-clip-${props.project.id}`)

// Single video element — clipped by SVG clipPath to show through frames
const videoEl = ref<HTMLVideoElement | null>(null)
const showVideo = ref(false)
const videoReady = ref(false)
const videoBudget = useVideobudget()
let unloadTimer: ReturnType<typeof setTimeout> | null = null

function onVideoReady() {
  videoReady.value = true
  videoEl.value?.play().catch(() => {})
}

watch(() => props.visible, (visible) => {
  if (props.project.type !== 'video') return
  if (visible && videoBudget.canPlay(props.project.id)) {
    if (unloadTimer) { clearTimeout(unloadTimer); unloadTimer = null }
    if (!showVideo.value) {
      showVideo.value = true
      videoBudget.register(props.project.id)
    } else {
      videoEl.value?.play().catch(() => {})
    }
  } else {
    videoEl.value?.pause()
    const delay = import.meta.client && window.innerWidth < 768 ? 2000 : 10000
    unloadTimer = setTimeout(() => {
      showVideo.value = false
      videoReady.value = false
      videoBudget.unregister(props.project.id)
      unloadTimer = null
    }, delay)
  }
}, { immediate: true })

onUnmounted(() => {
  videoBudget.unregister(props.project.id)
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
