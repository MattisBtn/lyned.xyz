<template>
  <div class="fixed bottom-4 right-4 md:bottom-5 md:right-5 z-30 flex items-center gap-1 border border-white/15 bg-black/70 backdrop-blur-md clip-corner px-1 py-1">
    <button
      v-for="mode in modes"
      :key="mode.value"
      type="button"
      class="p-1.5 md:p-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset"
      :class="modelValue === mode.value ? 'text-white/90' : 'text-white/30 hover:text-white/60'"
      :aria-label="mode.label"
      :aria-pressed="modelValue === mode.value"
      @click="select(mode.value)"
    >
      <!-- Canvas icon -->
      <svg v-if="mode.value === 'canvas'" class="w-3.5 h-3.5 md:w-4 md:h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
      </svg>
      <!-- Masonry icon -->
      <svg v-else-if="mode.value === 'masonry'" class="w-3.5 h-3.5 md:w-4 md:h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6h6.5v5h-6.5zM3.75 13h6.5v8h-6.5zM13.75 3h6.5v8h-6.5zM13.75 13h6.5v5h-6.5z" />
      </svg>
      <!-- List icon -->
      <svg v-else class="w-3.5 h-3.5 md:w-4 md:h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 5.25h16.5m-16.5-10.5h16.5" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
export type ViewMode = 'canvas' | 'masonry' | 'list'

const props = defineProps<{ modelValue: ViewMode }>()
const emit = defineEmits<{ 'update:modelValue': [value: ViewMode] }>()
const sound = useSound()

const modes = [
  { value: 'canvas' as const, label: 'Canvas View' },
  { value: 'masonry' as const, label: 'Masonry View' },
  { value: 'list' as const, label: 'List View' },
]

function select(value: ViewMode) {
  sound.click()
  emit('update:modelValue', value)
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
