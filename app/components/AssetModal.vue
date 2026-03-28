<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="project"
        role="dialog"
        aria-modal="true"
        :aria-label="`Viewing ${project.title}`"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="close"
      >
        <!-- Frame container -->
        <div ref="frameEl" class="relative bg-black/80 backdrop-blur-md border border-white/[0.08] frame-clip shadow-[0_0_60px_rgba(0,0,0,0.6)]">

          <!-- Outer corner brackets -->
          <div class="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 border-white/25" />
          <div class="absolute -top-px -right-px w-5 h-5 border-t-2 border-r-2 border-white/25" />
          <div class="absolute -bottom-px -left-px w-5 h-5 border-b-2 border-l-2 border-white/25" />
          <div class="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 border-white/25" />

          <!-- Top bar -->
          <div class="border-b border-white/[0.06] px-4 py-2.5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-1.5 h-1.5 rounded-full" :class="project.type === 'video' ? 'bg-emerald-400 animate-pulse' : 'bg-white/40'" />
              <span class="font-sans text-[10px] text-white/40 uppercase tracking-[0.2em]">
                {{ project.type === 'video' ? 'PLAYING' : 'VIEWING' }}
              </span>
              <div class="w-px h-3 bg-white/10" />
              <h2 class="font-sans text-[11px] text-white/60 uppercase tracking-[0.12em]">{{ project.title }}</h2>
            </div>
            <button
              ref="closeBtn"
              class="font-sans text-[10px] text-white/30 uppercase tracking-[0.15em] hover:text-white/70 transition-colors cursor-pointer"
              aria-label="Close modal"
              @click="close"
            >
              [ESC]
            </button>
          </div>

          <!-- Asset area -->
          <div class="p-1">
            <img
              v-if="project.type === 'image'"
              :src="project.src"
              :alt="project.title"
              class="max-w-[82vw] max-h-[72vh] object-contain block"
            />
            <video
              v-else
              :src="project.src"
              controls
              autoplay
              muted
              class="max-w-[82vw] max-h-[72vh] block"
            />
          </div>

          <!-- Bottom bar -->
          <div class="border-t border-white/[0.06] px-4 py-2 flex items-center justify-between">
            <span class="font-sans text-[9px] text-white/20 uppercase tracking-[0.2em]">
              {{ project.type === 'video' ? 'MP4' : 'PNG' }} // {{ project.id }}
            </span>
            <span class="font-sans text-[9px] text-white/20 uppercase tracking-[0.2em]">
              lyned.xyz
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Project } from '~/data/projects'

const props = defineProps<{ project: Project | null }>()
const emit = defineEmits<{ close: [] }>()
const closeBtn = ref<HTMLButtonElement | null>(null)

function close() {
  emit('close')
}

// Focus trap: move focus to close button when modal opens
watch(() => props.project, (val) => {
  if (val) {
    nextTick(() => closeBtn.value?.focus())
  }
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.project) {
    close()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.frame-clip {
  clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
