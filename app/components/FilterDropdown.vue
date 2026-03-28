<template>
  <div ref="root" class="fixed bottom-4 left-4 md:bottom-5 md:left-5 z-30">
    <!-- Toggle button -->
    <button
      ref="toggleBtn"
      type="button"
      class="flex items-center gap-2 md:gap-2.5 px-3 py-2 md:px-4 md:py-2.5 border border-white/15 bg-black/70 backdrop-blur-md hover:border-white/30 hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset transition-all duration-200 clip-corner outline-none"
      aria-label="Filter assets"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggleDropdown"
    >
      <span class="text-[10px] md:text-xs text-white/70 uppercase tracking-[0.15em]">{{ activeLabel }}</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 md:w-3.5 md:h-3.5 text-white/50 transition-transform duration-200" :class="{ 'rotate-180': open }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="open"
        ref="listEl"
        role="listbox"
        aria-label="Filter options"
        class="absolute bottom-full left-0 mb-1 border border-white/15 bg-black/85 backdrop-blur-md clip-corner overflow-hidden min-w-[140px] md:min-w-[170px]"
        @keydown="onListKeydown"
      >
        <button
          v-for="(option, i) in options"
          :key="option.value"
          :ref="el => { if (el) optionEls[i] = el as HTMLButtonElement }"
          type="button"
          role="option"
          :aria-selected="modelValue === option.value"
          class="flex items-center gap-2 md:gap-2.5 w-full px-3 py-2 md:px-4 md:py-2.5 hover:bg-white/[0.08] focus-visible:bg-white/[0.08] transition-colors duration-150 text-left outline-none"
          :class="modelValue === option.value ? 'text-white/90' : 'text-white/50'"
          @click="select(option.value)"
        >
          <div class="w-2 h-2 rounded-full transition-colors" :class="modelValue === option.value ? 'bg-emerald-400' : 'bg-white/25'" />
          <span class="text-[10px] md:text-xs uppercase tracking-[0.15em]">{{ option.label }}</span>
          <span class="text-[9px] md:text-[10px] text-white/35 ml-auto tabular-nums">{{ option.count }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/data/projects'

export type FilterValue = 'all' | 'image' | 'video'

const props = defineProps<{ modelValue: FilterValue, projects: Project[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: FilterValue] }>()

const root = ref<HTMLElement | null>(null)
const toggleBtn = ref<HTMLButtonElement | null>(null)
const listEl = ref<HTMLElement | null>(null)
const optionEls = reactive<HTMLButtonElement[]>([])
const open = ref(false)
const sound = useSound()

const counts = computed(() => ({
  all: props.projects.length,
  image: props.projects.filter(p => p.type === 'image').length,
  video: props.projects.filter(p => p.type === 'video').length,
}))

const options = computed(() => [
  { value: 'all' as const, label: 'All', count: counts.value.all },
  { value: 'image' as const, label: 'Graphic', count: counts.value.image },
  { value: 'video' as const, label: 'Motion', count: counts.value.video },
])

const activeLabel = computed(() => options.value.find(o => o.value === props.modelValue)?.label ?? 'All')

function toggleDropdown() {
  sound.click()
  open.value = !open.value
  if (open.value) {
    // Focus first option when opening
    nextTick(() => {
      const activeIndex = options.findIndex(o => o.value === props.modelValue)
      optionEls[activeIndex >= 0 ? activeIndex : 0]?.focus()
    })
  }
}

function select(value: FilterValue) {
  sound.click()
  emit('update:modelValue', value)
  open.value = false
  toggleBtn.value?.focus()
}

function onListKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    open.value = false
    toggleBtn.value?.focus()
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    const focused = document.activeElement as HTMLElement
    const idx = optionEls.indexOf(focused as HTMLButtonElement)
    const next = e.key === 'ArrowDown'
      ? (idx + 1) % optionEls.length
      : (idx - 1 + optionEls.length) % optionEls.length
    optionEls[next]?.focus()
  }
}

function onClickOutside(e: PointerEvent) {
  const target = e.target as Node | null
  if (open.value && root.value && target && !root.value.contains(target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('pointerdown', onClickOutside))
onUnmounted(() => document.removeEventListener('pointerdown', onClickOutside))
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

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
