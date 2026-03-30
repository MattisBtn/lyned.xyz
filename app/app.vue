<template>
  <div>
    <Preloader @done="onPreloaderDone" />
    <DitherBackground v-if="preloaderDone" />
    <NuxtPage />

    <!-- Mobile-only: desktop experience snackbar (post-preloader) -->
    <Transition name="desktop-hint">
      <div
        v-if="showDesktopHint"
        class="fixed bottom-6 left-4 right-4 z-[90] flex items-center justify-center"
      >
        <div class="w-full max-w-sm border border-white/10 bg-black/80 backdrop-blur-md px-4 py-3 flex items-center gap-3 snack-clip">
          <div class="w-1 h-1 rounded-full bg-white/30 shrink-0" />
          <p class="text-[9px] text-white/50 uppercase tracking-[0.2em] flex-1">
            Desktop recommended for full experience
          </p>
          <button
            type="button"
            class="text-[9px] text-white/30 uppercase tracking-[0.15em] hover:text-white/60 transition-colors shrink-0"
            @click="showDesktopHint = false"
          >
            OK
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const preloaderDone = ref(false)
const showDesktopHint = ref(false)
const isMobile = useIsMobile()
let hintTimers: ReturnType<typeof setTimeout>[] = []

function onPreloaderDone() {
  preloaderDone.value = true

  // Show desktop hint on mobile only, once per session
  // Delay to let preloader fade-out finish (0.8s transition)
  if (import.meta.client && isMobile.value && !localStorage.getItem('desktop-hint')) {
    hintTimers.push(setTimeout(() => {
      showDesktopHint.value = true
      localStorage.setItem('desktop-hint', '1')
      hintTimers.push(setTimeout(() => { showDesktopHint.value = false }, 4000))
    }, 1000))
  }
}

onUnmounted(() => hintTimers.forEach(clearTimeout))
</script>

<style>
.snack-clip {
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.desktop-hint-enter-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.desktop-hint-leave-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.desktop-hint-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.desktop-hint-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
