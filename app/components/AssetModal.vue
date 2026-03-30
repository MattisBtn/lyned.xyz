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

          <!-- Info toggle button (top right of frame) -->
          <button
            v-if="hasInfo"
            type="button"
            class="absolute top-12 right-3 z-20 w-8 h-8 flex items-center justify-center border bg-black/70 backdrop-blur-md hover:bg-black/80 transition-all duration-200 clip-corner cursor-pointer"
            :class="showInfo ? 'border-white/30 text-white/90' : 'border-white/15 text-white/40 hover:border-white/30 hover:text-white/70'"
            aria-label="Toggle project info"
            @click="showInfo = !showInfo"
          >
            <span class="font-sans text-xs font-medium select-none">i</span>
          </button>

          <!-- Info panel overlay -->
          <Transition name="info">
            <div
              v-if="showInfo && hasInfo"
              class="absolute inset-0 z-10 flex items-end pointer-events-none"
              style="top: 40px; bottom: 32px"
            >
              <div class="w-full pointer-events-auto bg-gradient-to-t from-black/90 via-black/70 to-transparent px-5 py-5 space-y-3">
                <p v-if="project.description" class="font-sans text-[11px] md:text-xs text-white/70 leading-relaxed max-w-lg">{{ project.description }}</p>
                <a
                  v-if="safeLink"
                  :href="safeLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 font-sans text-[10px] text-white/40 uppercase tracking-[0.15em] hover:text-white/70 transition-colors"
                >
                  <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  {{ safeLink.replace(/^https?:\/\//, '') }}
                </a>
              </div>
            </div>
          </Transition>

          <!-- Bottom bar -->
          <div class="border-t border-white/[0.06] px-4 py-2 flex items-center justify-between">
            <span class="font-sans text-[9px] text-white/20 uppercase tracking-[0.2em]">
              {{ project.type === 'video' ? 'MP4' : 'WEBP' }} // {{ project.id }}
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
const showInfo = ref(false)

const safeLink = computed(() => {
  const url = props.project?.link
  return url && /^https?:\/\//i.test(url) ? url : null
})

const hasInfo = computed(() => !!(props.project?.description || safeLink.value))

function close() {
  emit('close')
}

// Focus trap + reset info panel when modal opens/closes
watch(() => props.project, (val) => {
  showInfo.value = false
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

.clip-corner {
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.info-enter-active,
.info-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.info-enter-from,
.info-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
