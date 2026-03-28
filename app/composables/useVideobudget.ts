const isMobile = import.meta.client ? window.innerWidth < 768 : false
const MAX_VIDEOS = isMobile ? 2 : 6

const activeIds = ref<string[]>([])

export function useVideobudget() {
  function canPlay(id: string): boolean {
    return activeIds.value.includes(id) || activeIds.value.length < MAX_VIDEOS
  }

  function register(id: string) {
    if (!activeIds.value.includes(id)) {
      activeIds.value.push(id)
    }
  }

  function unregister(id: string) {
    const idx = activeIds.value.indexOf(id)
    if (idx !== -1) activeIds.value.splice(idx, 1)
  }

  return { canPlay, register, unregister }
}
