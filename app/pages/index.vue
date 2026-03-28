<template>
  <div>
    <!-- Header -->
    <header class="fixed top-0 left-0 z-30 p-5">
      <img src="/logo.svg" alt="LYNED" class="h-5 opacity-90" draggable="false" />
    </header>

    <!-- Sound toggle (top right) -->
    <SoundToggle />

    <!-- Filter dropdown (bottom left) -->
    <FilterDropdown v-model="filter" :projects="projects" />

    <!-- Sandbox -->
    <SandboxCanvas :disabled="!!activeProject" :projects="projects" v-slot="{ isVisible }">
      <ProjectCard
        v-for="project in projects"
        :key="project.id"
        v-show="filter === 'all' || project.type === filter"
        :project="project"
        :visible="isVisible(project)"
        @open="openProject"
      />
    </SandboxCanvas>

    <!-- Loading / Error state -->
    <div v-if="loading || error" class="fixed inset-0 z-20 flex items-center justify-center pointer-events-none">
      <span v-if="loading" class="text-[10px] text-white/30 uppercase tracking-[0.2em] animate-pulse">Loading projects...</span>
      <span v-else-if="error" class="text-[10px] text-red-400/50 uppercase tracking-[0.2em]">Could not load projects</span>
    </div>

    <!-- Modal -->
    <AssetModal :project="activeProject" @close="closeProject" />

    <noscript>
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black text-white font-sans text-sm">
        LYNED — Creative Portfolio. Enable JavaScript to explore.
      </div>
    </noscript>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/data/projects'
import type { FilterValue } from '~/components/FilterDropdown.vue'

const activeProject = ref<Project | null>(null)
const filter = ref<FilterValue>('all')
const sound = useSound()

// Fetch projects from API (R2-backed) — client-only
const projectsData = ref<Project[]>([])
const projects = computed(() => projectsData.value)
const loading = ref(true)
const error = ref(false)

if (import.meta.client) {
  onMounted(async () => {
    try {
      projectsData.value = await $fetch<Project[]>('/api/projects')
    } catch {
      error.value = true
      projectsData.value = []
    } finally {
      loading.value = false
    }
  })
}

function openProject(project: Project) {
  sound.open()
  activeProject.value = project
}

function closeProject() {
  sound.close()
  activeProject.value = null
}
</script>
