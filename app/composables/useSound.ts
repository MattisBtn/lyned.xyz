const noop = () => {}

// Module-scope shared state (H2 fix: single cache across all components)
const muted = ref(false)
const cache = new Map<string, HTMLAudioElement>()
let preloaded = false

function preload(src: string) {
  if (!cache.has(src)) {
    const audio = new Audio(src)
    audio.preload = 'auto'
    cache.set(src, audio)
  }
}

function play(src: string, force = false) {
  if (!force && muted.value) return
  const cached = cache.get(src)
  if (cached) {
    cached.currentTime = 0
    cached.play().catch(() => {})
  } else {
    const audio = new Audio(src)
    audio.play().catch(() => {})
    cache.set(src, audio)
  }
}

export function useSound() {
  if (import.meta.server) {
    return { click: noop, open: noop, close: noop, forceClick: noop, muted, toggle: noop }
  }

  onMounted(() => {
    if (preloaded) return
    preloaded = true
    preload('/sounds/click.mp3')
    preload('/sounds/open.mp3')
    preload('/sounds/close.mp3')
  })

  return {
    click: () => play('/sounds/click.mp3'),
    open: () => play('/sounds/open.mp3'),
    close: () => play('/sounds/close.mp3'),
    forceClick: () => play('/sounds/click.mp3', true),
    muted,
    toggle: () => { muted.value = !muted.value },
  }
}
