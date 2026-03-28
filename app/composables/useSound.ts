const noop = () => {}

export function useSound() {
  // SSR: return no-ops immediately
  if (import.meta.server) {
    return { click: noop, open: noop, close: noop }
  }

  // Client-only cache (scoped to avoid SSR cross-request leaks)
  const cache = new Map<string, HTMLAudioElement>()

  function preload(src: string) {
    if (!cache.has(src)) {
      const audio = new Audio(src)
      audio.preload = 'auto'
      cache.set(src, audio)
    }
  }

  function play(src: string) {
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

  onMounted(() => {
    preload('/sounds/click.mp3')
    preload('/sounds/open.mp3')
    preload('/sounds/close.mp3')
  })

  return {
    click: () => play('/sounds/click.mp3'),
    open: () => play('/sounds/open.mp3'),
    close: () => play('/sounds/close.mp3'),
  }
}
