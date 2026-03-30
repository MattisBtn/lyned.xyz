const isMobile = ref(false)
let initialized = false

function init() {
  if (initialized || !import.meta.client) return
  initialized = true
  const mq = window.matchMedia('(max-width: 767px)')
  isMobile.value = mq.matches
  mq.addEventListener('change', (e) => { isMobile.value = e.matches })
}

export function useIsMobile() {
  if (import.meta.client) {
    onMounted(init)
  }
  return isMobile
}
