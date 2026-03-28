<template>
  <div class="min-h-screen bg-[#0a0a0f] text-white font-sans">

    <!-- ===== LOGIN ===== -->
    <Transition name="fade">
      <div v-if="!authenticated" class="fixed inset-0 flex items-center justify-center bg-[#0a0a0f]">
        <form class="relative w-80" @submit.prevent="login">
          <!-- Frame -->
          <div class="border border-white/10 bg-black/60 backdrop-blur-md clip-lg p-8">
            <!-- Corner brackets -->
            <div class="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-white/25" />
            <div class="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-white/25" />
            <div class="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-white/25" />
            <div class="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-white/25" />

            <!-- Status indicator -->
            <div class="flex items-center gap-2 mb-6">
              <div class="w-1.5 h-1.5 rounded-full bg-red-400/80" />
              <span class="text-[9px] text-white/30 uppercase tracking-[0.2em]">Locked</span>
            </div>

            <h1 class="text-[11px] uppercase tracking-[0.2em] text-white/70 mb-6">Admin Access</h1>

            <input
              v-model="password"
              type="password"
              placeholder="Enter password"
              autocomplete="current-password"
              class="w-full bg-white/[0.03] border border-white/10 px-3 py-2.5 text-sm text-white/90 placeholder:text-white/20 outline-none focus:border-white/25 transition-colors mb-1"
            />
            <Transition name="fade">
              <p v-if="loginError" class="text-red-400/80 text-[9px] uppercase tracking-[0.15em] mt-2 mb-1">{{ loginError }}</p>
            </Transition>

            <button
              type="submit"
              class="w-full mt-4 bg-white/[0.06] border border-white/15 px-3 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white/60 hover:bg-white/10 hover:text-white/90 hover:border-white/25 transition-all clip-sm"
            >
              Authenticate
            </button>
          </div>
        </form>
      </div>
    </Transition>

    <!-- ===== DASHBOARD ===== -->
    <div v-if="authenticated" class="p-5 md:p-8 lg:p-10 max-w-7xl mx-auto">

      <!-- Top bar -->
      <div class="flex items-center justify-between mb-8 pb-5 border-b border-white/[0.06]">
        <div class="flex items-center gap-4">
          <img src="/logo.svg" alt="LYNED" class="h-4 opacity-60" />
          <div class="w-px h-4 bg-white/10" />
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span class="text-[9px] text-white/40 uppercase tracking-[0.2em]">Admin</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-4 py-2 text-[10px] uppercase tracking-[0.15em] border border-white/15 bg-black/50 hover:bg-white/[0.08] hover:border-white/25 transition-all text-white/50 hover:text-white/90 clip-sm"
            :class="ingesting ? 'opacity-50 pointer-events-none' : ''"
            @click="runIngest"
          >
            <span v-if="ingesting" class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Processing
            </span>
            <span v-else>Run Ingest</span>
          </button>
          <NuxtLink
            to="/"
            class="px-4 py-2 text-[10px] uppercase tracking-[0.15em] border border-white/15 bg-black/50 hover:bg-white/[0.08] hover:border-white/25 transition-all text-white/50 hover:text-white/90 clip-sm"
          >
            View Site
          </NuxtLink>
        </div>
      </div>

      <!-- Stats bar -->
      <div class="flex gap-6 mb-8">
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-white/30" />
          <span class="text-[10px] text-white/50 uppercase tracking-[0.15em]">{{ assets.graphic.length }} Graphic</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
          <span class="text-[10px] text-white/50 uppercase tracking-[0.15em]">{{ assets.motion.length }} Motion</span>
        </div>
      </div>

      <!-- Upload zone -->
      <div class="relative mb-8">
        <div
          class="border border-dashed border-white/[0.08] bg-white/[0.01] py-12 text-center transition-all clip-lg"
          :class="dragOver ? 'border-white/30 bg-white/[0.04]' : 'hover:border-white/15 hover:bg-white/[0.02]'"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="onDrop"
        >
          <!-- Upload icon -->
          <svg class="w-6 h-6 mx-auto mb-3 text-white/20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p class="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Drop files here</p>
          <p class="text-[9px] text-white/20 mb-4">PNG, JPG, MP4, MKV, MOV</p>
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*,video/*"
            class="hidden"
            @change="onFileSelect"
          />
          <button
            type="button"
            class="px-4 py-2 text-[9px] uppercase tracking-[0.15em] border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
            @click="($refs.fileInput as HTMLInputElement).click()"
          >
            Browse
          </button>
        </div>

        <!-- Upload progress overlay -->
        <Transition name="fade">
          <div v-if="uploading" class="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm clip-lg">
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
              <span class="text-[10px] text-white/60 uppercase tracking-[0.2em]">Uploading {{ uploadCount }} file(s)</span>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Ingest output -->
      <Transition name="slide">
        <div v-if="ingestOutput" class="relative mb-8 border border-white/[0.06] bg-black/40 clip-sm overflow-hidden">
          <div class="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full" :class="ingestOutput.startsWith('Error') ? 'bg-red-400' : 'bg-emerald-400'" />
              <span class="text-[9px] text-white/40 uppercase tracking-[0.2em]">Ingest Output</span>
            </div>
            <button type="button" class="text-[9px] text-white/30 hover:text-white/60 uppercase" @click="ingestOutput = ''">Clear</button>
          </div>
          <pre class="px-4 py-3 text-[10px] text-white/50 whitespace-pre-wrap font-mono max-h-48 overflow-auto leading-relaxed">{{ ingestOutput }}</pre>
        </div>
      </Transition>

      <!-- Section: Graphic -->
      <div v-if="assets.graphic.length" class="mb-8">
        <h2 class="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-white/30" />
          Graphic
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          <div
            v-for="asset in assets.graphic"
            :key="asset.id"
            class="relative group border border-white/[0.06] bg-black/30 overflow-hidden hover:border-white/15 transition-all clip-sm cursor-pointer"
            @click="openPreview({ src: asset.src, type: 'image', title: asset.title })"
          >
            <div class="aspect-[4/3] bg-black/50 overflow-hidden">
              <img :src="asset.thumbnail" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
            </div>
            <div class="px-2.5 py-2 flex items-center justify-between bg-black/40">
              <span class="text-[9px] text-white/50 truncate pr-2">{{ asset.title }}</span>
              <button
                type="button"
                class="text-[9px] text-red-400/40 hover:text-red-400 uppercase shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                @click.stop="deleteAsset(asset)"
              >
                Del
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Section: Motion -->
      <div v-if="assets.motion.length" class="mb-8">
        <h2 class="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
          Motion
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          <div
            v-for="asset in assets.motion"
            :key="asset.id"
            class="relative group border border-white/[0.06] bg-black/30 overflow-hidden hover:border-white/15 transition-all clip-sm cursor-pointer"
            @click="openPreview({ src: asset.src, type: 'video', title: asset.title })"
          >
            <div class="aspect-video bg-black/60 overflow-hidden flex items-center justify-center">
              <img
                v-if="asset.thumbnail"
                :src="asset.thumbnail"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <span v-else class="text-[9px] text-white/15 uppercase tracking-wider">MP4</span>
            </div>
            <div class="px-2.5 py-2 flex items-center justify-between bg-black/40">
              <span class="text-[9px] text-white/50 truncate pr-2">{{ asset.title }}</span>
              <button
                type="button"
                class="text-[9px] text-red-400/40 hover:text-red-400 uppercase shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                @click.stop="deleteAsset(asset)"
              >
                Del
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== PREVIEW MODAL ===== -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="preview"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          @click.self="preview = null"
          @keydown.escape="preview = null"
        >
          <div class="relative border border-white/[0.08] bg-black/80 backdrop-blur-md clip-lg shadow-[0_0_60px_rgba(0,0,0,0.6)]">
            <!-- Corner brackets -->
            <div class="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 border-white/25" />
            <div class="absolute -top-px -right-px w-5 h-5 border-t-2 border-r-2 border-white/25" />
            <div class="absolute -bottom-px -left-px w-5 h-5 border-b-2 border-l-2 border-white/25" />
            <div class="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 border-white/25" />

            <!-- Top bar -->
            <div class="border-b border-white/[0.06] px-4 py-2.5 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-1.5 h-1.5 rounded-full" :class="preview.type === 'video' ? 'bg-emerald-400 animate-pulse' : 'bg-white/40'" />
                <span class="text-[11px] text-white/60 uppercase tracking-[0.12em]">{{ preview.title }}</span>
              </div>
              <button
                type="button"
                class="text-[10px] text-white/30 uppercase tracking-[0.15em] hover:text-white/70 transition-colors cursor-pointer"
                @click="preview = null"
              >
                [ESC]
              </button>
            </div>

            <!-- Asset -->
            <div class="p-1">
              <img
                v-if="preview.type === 'image'"
                :src="preview.src"
                :alt="preview.title"
                class="max-w-[82vw] max-h-[72vh] object-contain block"
              />
              <video
                v-else
                :src="preview.src"
                controls
                autoplay
                muted
                class="max-w-[82vw] max-h-[72vh] block"
              />
            </div>

            <!-- Bottom bar -->
            <div class="border-t border-white/[0.06] px-4 py-2 flex items-center justify-between">
              <span class="text-[9px] text-white/20 uppercase tracking-[0.2em]">
                {{ preview.type === 'video' ? 'MP4' : 'IMAGE' }}
              </span>
              <span class="text-[9px] text-white/20 uppercase tracking-[0.2em]">Admin Preview</span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const authenticated = ref(false)
const password = ref('')
const loginError = ref('')
const dragOver = ref(false)
const uploading = ref(false)
const uploadCount = ref(0)
const ingesting = ref(false)
const ingestOutput = ref('')
const preview = ref<{ src: string, type: string, title: string } | null>(null)

function openPreview(asset: { src: string, type: string, title: string }) {
  preview.value = asset
}

const assets = reactive<{ graphic: any[], motion: any[] }>({
  graphic: [], motion: [],
})

const token = ref('')
const projectsList = ref<any[]>([])

function authHeaders(): Record<string, string> {
  return token.value ? { 'x-admin-token': token.value } : {}
}

// --- Client-side image compression to WebP ---
async function compressImageToWebP(file: File, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Compression failed')),
        'image/webp',
        quality,
      )
    }
    img.onerror = (err) => { URL.revokeObjectURL(img.src); reject(err) }
    img.src = URL.createObjectURL(file)
  })
}

function isImageFile(name: string) {
  return /\.(png|jpg|jpeg|webp|bmp|gif)$/i.test(name)
}

function isVideoFile(name: string) {
  return /\.(mp4|mkv|mov|webm)$/i.test(name)
}

async function login() {
  loginError.value = ''
  try {
    const res = await $fetch<{ token: string }>('/api/admin/login', { method: 'POST', body: { password: password.value } })
    token.value = res.token
    authenticated.value = true
    await loadAssets()
  } catch {
    loginError.value = 'Invalid credentials'
  }
}

async function loadAssets() {
  try {
    const data = await $fetch<{ projects: any[] }>('/api/admin/projects', { headers: authHeaders() })
    projectsList.value = data.projects || []
    assets.graphic = projectsList.value.filter(p => p.type === 'image')
    assets.motion = projectsList.value.filter(p => p.type === 'video')
  } catch {
    // Not authenticated
  }
}

async function uploadFiles(files: FileList | File[]) {
  uploading.value = true
  uploadCount.value = files.length

  const formData = new FormData()

  for (const file of Array.from(files)) {
    if (isImageFile(file.name)) {
      // Compress image to WebP client-side
      try {
        const webpBlob = await compressImageToWebP(file)
        const webpName = file.name.replace(/\.[^.]+$/, '.webp')
        formData.append('files', new File([webpBlob], webpName, { type: 'image/webp' }))
      } catch {
        formData.append('files', file) // Fallback: upload as-is
      }
    } else if (isVideoFile(file.name)) {
      formData.append('files', file)
    }
  }

  try {
    await $fetch('/api/admin/upload', { method: 'POST', body: formData, headers: authHeaders() })
    // Auto-run ingest after upload to regenerate positions
    await runIngest()
  } catch (err: any) {
    console.error('Upload failed:', err)
  }
  uploading.value = false
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  if (e.dataTransfer?.files.length) {
    uploadFiles(e.dataTransfer.files)
  }
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) {
    uploadFiles(input.files)
  }
}

async function deleteAsset(project: any) {
  const key = project.type === 'image'
    ? `graphic/${project.id}.webp`
    : `motion/${project.id}.mp4`
  try {
    await $fetch('/api/admin/delete', { method: 'POST', body: { key }, headers: authHeaders() })
    // Re-run ingest to update positions
    await runIngest()
  } catch (err: any) {
    console.error('Delete failed:', err)
  }
}

async function runIngest() {
  ingesting.value = true
  ingestOutput.value = ''
  try {
    const result = await $fetch<{ ok: boolean, output: string }>('/api/admin/ingest', { method: 'POST', headers: authHeaders() })
    ingestOutput.value = result.output
    await loadAssets()
  } catch (err: any) {
    ingestOutput.value = `Error: ${err.message}`
  }
  ingesting.value = false
}

// M5: Global escape key for preview modal
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && preview.value) {
    preview.value = null
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  try {
    await $fetch<{ projects: any[] }>('/api/admin/projects')
    authenticated.value = true
    await loadAssets()
  } catch {
    // Not authenticated
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.clip-lg {
  clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
}
.clip-sm {
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
