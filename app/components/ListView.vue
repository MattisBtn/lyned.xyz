<template>
  <div class="fixed inset-0 z-10 overflow-auto pt-16 pb-20 px-4 md:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Table header -->
      <div class="hidden md:flex items-center gap-4 px-4 py-2 border-b border-white/[0.06] mb-1">
        <span class="text-[9px] text-white/25 uppercase tracking-[0.2em] w-16">Type</span>
        <span class="text-[9px] text-white/25 uppercase tracking-[0.2em] flex-1">Title</span>
        <span class="text-[9px] text-white/25 uppercase tracking-[0.2em] w-20 text-right">Format</span>
      </div>

      <!-- Rows -->
      <div
        v-for="(project, i) in projects"
        :key="project.id"
        class="group cursor-pointer border border-white/[0.06] bg-black/60 backdrop-blur-sm mb-1 hover:border-white/15 hover:bg-black/70 transition-all duration-200 clip-row reveal-row"
        :style="{ animationDelay: `${i * 30}ms` }"
        role="button"
        tabindex="0"
        @click="$emit('open', project)"
        @keydown.enter="$emit('open', project)"
      >
        <div class="flex items-center gap-4 px-4 py-3 md:py-2.5">
          <!-- Status dot -->
          <div class="w-16 shrink-0 flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full" :class="project.type === 'video' ? 'bg-emerald-400' : 'bg-white/40'" />
            <span class="text-[9px] text-white/30 uppercase tracking-[0.15em] hidden md:inline">{{ project.type === 'video' ? 'MOT' : 'GFX' }}</span>
          </div>

          <!-- Thumbnail (small) -->
          <div class="w-12 h-8 md:w-16 md:h-10 shrink-0 overflow-hidden border border-white/[0.06] bg-black/30">
            <img
              :src="project.thumbnail"
              :alt="project.title"
              loading="lazy"
              class="w-full h-full object-cover"
              draggable="false"
            />
          </div>

          <!-- Title -->
          <span class="flex-1 text-[11px] md:text-xs text-white/70 uppercase tracking-[0.1em] truncate group-hover:text-white/90 transition-colors">
            {{ project.title }}
          </span>

          <!-- Index -->
          <span class="text-[9px] text-white/15 tabular-nums w-8 text-right hidden md:block">
            {{ String(i + 1).padStart(2, '0') }}
          </span>

          <!-- Format -->
          <span class="text-[9px] text-white/30 uppercase tracking-[0.15em] w-12 md:w-20 text-right">
            {{ project.type === 'video' ? 'MP4' : 'WEBP' }}
          </span>

          <!-- Arrow -->
          <svg class="w-3 h-3 text-white/15 group-hover:text-white/40 transition-colors shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>

        <!-- Separator -->
        <div class="mx-4 border-b border-white/[0.04]" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/data/projects'

defineProps<{ projects: Project[] }>()
defineEmits<{ open: [project: Project] }>()
</script>

<style scoped>
.clip-row {
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
}

.reveal-row {
  opacity: 0;
  transform: translateX(-20px);
  animation: revealSlide 0.3s ease-out forwards;
}

@keyframes revealSlide {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
