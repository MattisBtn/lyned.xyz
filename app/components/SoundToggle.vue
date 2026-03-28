<template>
  <button
    type="button"
    class="fixed top-4 right-4 md:top-5 md:right-5 z-30 flex items-center gap-2 md:gap-2.5 px-3 py-2 md:px-4 md:py-2.5 border border-white/15 bg-black/70 backdrop-blur-md hover:border-white/30 hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset transition-all duration-200 clip-corner outline-none"
    :aria-label="muted ? 'Unmute sounds' : 'Mute sounds'"
    @click="handleToggle"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-[18px] md:h-[18px] text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424" v-if="!muted" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M23 9l-6 6M17 9l6 6" v-if="muted" />
    </svg>
    <span class="text-[10px] md:text-xs text-white/70 uppercase tracking-[0.15em]">
      {{ muted ? 'OFF' : 'ON' }}
    </span>
    <div class="w-2 h-2 rounded-full transition-colors duration-200" :class="muted ? 'bg-white/30' : 'bg-emerald-400'" />
  </button>
</template>

<script setup lang="ts">
const { muted, toggle, forceClick } = useSound()

function handleToggle() {
  forceClick()
  toggle()
}
</script>

<style scoped>
.clip-corner {
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

@media (min-width: 768px) {
  .clip-corner {
    clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  }
}
</style>
