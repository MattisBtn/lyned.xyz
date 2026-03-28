<template>
  <div>
    <!-- Entry gate: click to start (required for audio autoplay) -->
    <div v-if="!booting && visible" class="fixed inset-0 z-[100] bg-[#0a0a0f] flex items-center justify-center cursor-pointer" @click="startBoot">
      <div class="flex flex-col items-center gap-6">
        <img src="/logo.svg" alt="LYNED" class="h-5 md:h-7 opacity-40" />
        <button type="button" class="text-[9px] text-white/25 uppercase tracking-[0.3em] hover:text-white/50 transition-colors animate-pulse">
          Click to enter
        </button>
      </div>
    </div>

    <!-- Boot sequence -->
    <Transition name="preloader">
      <div v-if="booting && visible" class="fixed inset-0 z-[100] bg-[#0a0a0f] overflow-hidden">

      <!-- Scan lines overlay (full screen) -->
      <div class="absolute inset-0 pointer-events-none scan-lines opacity-20" />

      <!-- Grid overlay -->
      <div class="absolute inset-0 pointer-events-none grid-bg opacity-[0.03]" />

      <!-- Corner brackets -->
      <div class="absolute top-5 left-5 w-8 h-8 border-t-2 border-l-2 transition-all duration-1000" :class="phase >= 1 ? 'border-white/20' : 'border-white/0'" />
      <div class="absolute top-5 right-5 w-8 h-8 border-t-2 border-r-2 transition-all duration-1000" :class="phase >= 1 ? 'border-white/20' : 'border-white/0'" />
      <div class="absolute bottom-5 left-5 w-8 h-8 border-b-2 border-l-2 transition-all duration-1000" :class="phase >= 1 ? 'border-white/20' : 'border-white/0'" />
      <div class="absolute bottom-5 right-5 w-8 h-8 border-b-2 border-r-2 transition-all duration-1000" :class="phase >= 1 ? 'border-white/20' : 'border-white/0'" />

      <!-- Center content -->
      <div class="absolute inset-0 flex flex-col items-center justify-center">

        <!-- Phase 1: Vertical line draws -->
        <div class="absolute w-px bg-white/10 left-1/2 transition-all duration-1000 ease-out" :style="{ height: phase >= 1 ? '120px' : '0px', top: 'calc(50% - 100px)', opacity: phase >= 3 ? 0 : 1 }" />
        <div class="absolute w-px bg-white/10 left-1/2 transition-all duration-1000 ease-out" :style="{ height: phase >= 1 ? '120px' : '0px', bottom: 'calc(50% - 100px)', opacity: phase >= 3 ? 0 : 1 }" />

        <!-- Phase 2: Logo reveal -->
        <div class="relative mb-10">
          <img
            src="/logo.svg"
            alt="LYNED"
            class="h-7 md:h-10 transition-all duration-1000 ease-out"
            :style="{
              opacity: phase >= 2 ? 0.95 : 0,
              transform: phase >= 2 ? 'scale(1)' : 'scale(0.8)',
              filter: phase === 2 ? 'blur(0px)' : phase < 2 ? 'blur(8px)' : 'blur(0px)',
            }"
          />
          <!-- Glitch flicker on logo -->
          <div
            v-if="glitch"
            class="absolute inset-0 flex items-center justify-center"
          >
            <img
              src="/logo.svg"
              alt=""
              class="h-7 md:h-10 opacity-30"
              :style="{ transform: `translate(${glitchX}px, ${glitchY}px)`, filter: 'hue-rotate(90deg)' }"
            />
          </div>
        </div>

        <!-- Phase 3: Progress system -->
        <div
          class="transition-all duration-700"
          :style="{ opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? 'translateY(0)' : 'translateY(12px)' }"
        >
          <!-- Progress bar with dither texture -->
          <div class="w-56 md:w-72 relative h-[5px] clip-bar overflow-hidden">
            <!-- Track -->
            <div class="absolute inset-0 bg-white/[0.04]" />
            <!-- Dithered fill -->
            <div
              class="absolute inset-y-0 left-0 dither-fill transition-all duration-500 ease-out"
              :style="{ width: `${progress}%` }"
            />
          </div>

          <!-- Status line -->
          <div class="mt-3 flex items-center justify-between w-56 md:w-72">
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full transition-colors duration-300" :class="progress >= 100 ? 'bg-emerald-400' : 'bg-white/40 animate-pulse'" />
              <span class="text-[9px] text-white/40 uppercase tracking-[0.2em] transition-all duration-300">{{ statusText }}</span>
            </div>
            <span class="text-[9px] text-white/20 tabular-nums tracking-wider">{{ Math.floor(progress) }}%</span>
          </div>
        </div>
      </div>

      <!-- Phase 4: Peripheral data (terminal feel) -->
      <div
        class="absolute top-6 left-14 transition-all duration-700"
        :style="{ opacity: phase >= 4 ? 0.3 : 0 }"
      >
        <div class="text-[8px] text-white/30 uppercase tracking-[0.15em] space-y-1">
          <div>SYS // LYNED.XYZ</div>
          <div>ENV // PRODUCTION</div>
          <div>VER // 1.0.0</div>
        </div>
      </div>

      <div
        class="absolute bottom-6 right-14 text-right transition-all duration-700"
        :style="{ opacity: phase >= 4 ? 0.3 : 0 }"
      >
        <div class="text-[8px] text-white/30 uppercase tracking-[0.15em] space-y-1">
          <div>GRAPHIC // MOTION // WEB</div>
          <div>CREATIVE PORTFOLIO</div>
        </div>
      </div>

      <!-- Horizontal lines that expand during phase 5 -->
      <div
        class="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none"
        :style="{ opacity: phase >= 5 ? 1 : 0 }"
      >
        <div class="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-1000 expand-line" />
      </div>
    </div>
  </Transition>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ done: [] }>()

const visible = ref(true)
const booting = ref(false)
const phase = ref(0)
const progress = ref(0)
const statusText = ref('Initializing')
const glitch = ref(false)
const glitchX = ref(0)
const glitchY = ref(0)

const stages = [
  { at: 0, text: 'Initializing' },
  { at: 15, text: 'Loading shaders' },
  { at: 35, text: 'Compiling dither matrix' },
  { at: 50, text: 'Fetching projects' },
  { at: 65, text: 'Decoding assets' },
  { at: 80, text: 'Building canvas' },
  { at: 92, text: 'Finalizing' },
  { at: 100, text: 'Ready' },
]

function triggerGlitch() {
  glitch.value = true
  glitchX.value = (Math.random() - 0.5) * 6
  glitchY.value = (Math.random() - 0.5) * 4
  setTimeout(() => { glitch.value = false }, 80)
}

// --- Cyberpunk boot sound (uses existing click/open sounds + synth) ---
function bootSound() {
  // Play the existing click.mp3 as rhythmic ticks synced with progress
  const click = new Audio('/sounds/click.mp3')
  const open = new Audio('/sounds/open.mp3')
  const close = new Audio('/sounds/close.mp3')

  // Preload
  click.preload = 'auto'
  open.preload = 'auto'
  close.preload = 'auto'

  // Phase 2 (0.8s): play open sound on logo reveal
  setTimeout(() => {
    open.volume = 0.3
    open.play().catch(() => {})
  }, 800)

  // Phase 3 (2.4s–5.5s): click ticks that accelerate with the progress bar
  const tickTimes = [
    2400, 2700, 2950, 3150, 3320, 3470, 3600, 3710,
    3810, 3900, 3980, 4050, 4110, 4165, 4215, 4260,
    4300, 4340, 4380, 4420, 4460, 4500, 4540, 4580,
    4630, 4690, 4760, 4850, 4960, 5100, 5300,
  ]

  tickTimes.forEach((t, i) => {
    setTimeout(() => {
      const tick = click.cloneNode() as HTMLAudioElement
      // Volume increases slightly as progress advances, pitch feel from acceleration
      tick.volume = 0.1 + (i / tickTimes.length) * 0.15
      tick.playbackRate = 0.9 + (i / tickTimes.length) * 0.4
      tick.play().catch(() => {})
    }, t)
  })

  // Phase 5 (5.8s): close sound as completion
  setTimeout(() => {
    close.volume = 0.4
    close.playbackRate = 0.8
    close.play().catch(() => {})
  }, 5800)
}

const timers: ReturnType<typeof setTimeout>[] = []

function delay(fn: () => void, ms: number) {
  timers.push(setTimeout(fn, ms))
}

onUnmounted(() => timers.forEach(clearTimeout))

function startBoot() {
  booting.value = true
  bootSound()

  delay(() => { phase.value = 1 }, 100)
  delay(() => { phase.value = 2 }, 800)
  delay(() => triggerGlitch(), 1200)
  delay(() => triggerGlitch(), 1600)
  delay(() => triggerGlitch(), 2800)
  delay(() => { phase.value = 3 }, 1800)
  delay(() => { phase.value = 4 }, 2200)

  delay(() => {
    let current = 0
    const interval = setInterval(() => {
      current += Math.random() * 8 + 3
      if (current >= 100) { current = 100; clearInterval(interval) }
      progress.value = Math.min(current, 100)
      for (const stage of stages) {
        if (progress.value >= stage.at) statusText.value = stage.text
      }
    }, 250)
  }, 2400)

  delay(() => { phase.value = 5 }, 5800)
  delay(() => { visible.value = false; emit('done') }, 6500)
}
</script>

<style scoped>
.scan-lines {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.02) 2px,
    rgba(255, 255, 255, 0.02) 4px
  );
}

.grid-bg {
  background-image:
    linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px);
  background-size: 60px 60px;
}

.dither-fill {
  background: repeating-linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.7) 0px,
    rgba(255, 255, 255, 0.7) 1px,
    rgba(255, 255, 255, 0.2) 1px,
    rgba(255, 255, 255, 0.2) 2px,
    rgba(255, 255, 255, 0.5) 2px,
    rgba(255, 255, 255, 0.5) 3px,
    transparent 3px,
    transparent 4px
  );
}

.clip-bar {
  clip-path: polygon(0 0, calc(100% - 4px) 0, 100% 100%, 4px 100%);
}

.expand-line {
  animation: expandH 1s ease-out forwards;
}

@keyframes expandH {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.preloader-leave-active {
  transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
.preloader-leave-to {
  opacity: 0;
}
</style>
