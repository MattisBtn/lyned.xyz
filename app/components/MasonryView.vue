<template>
  <div class="fixed inset-0 z-10 overflow-auto pt-16 pb-20 px-4 md:px-8">
    <div class="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 md:gap-4 max-w-7xl mx-auto">
      <div
        v-for="project in projects"
        :key="project.id"
        class="break-inside-avoid mb-3 md:mb-4 group cursor-pointer"
        role="button"
        tabindex="0"
        @click="$emit('open', project)"
        @keydown.enter="$emit('open', project)"
      >
        <div class="relative border border-white/10 bg-black/30 overflow-hidden hover:border-white/25 hover:shadow-[0_0_20px_rgba(255,255,255,0.06)] transition-all duration-300 clip-card">
          <!-- Corner markers -->
          <div class="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-white/20 z-10" />
          <div class="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-white/20 z-10" />
          <div class="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-white/20 z-10" />
          <div class="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-white/20 z-10" />

          <!-- Media -->
          <div class="overflow-hidden">
            <img
              :src="project.thumbnail"
              :alt="project.title"
              loading="lazy"
              class="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              draggable="false"
            />
          </div>

          <!-- Info bar -->
          <div class="border-t border-white/10 bg-black/50 px-2.5 py-1.5 flex items-center justify-between gap-2">
            <span class="text-[9px] md:text-[10px] text-white/80 uppercase tracking-[0.12em] truncate">{{ project.title }}</span>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="text-[8px] md:text-[9px] text-white/40 uppercase">{{ project.type === 'video' ? 'MP4' : 'WEBP' }}</span>
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

defineProps<{ projects: Project[] }>()
defineEmits<{ open: [project: Project] }>()
</script>

<style scoped>
.clip-card {
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
}
</style>
