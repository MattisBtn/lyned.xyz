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

    <!-- View toggle (bottom right) -->
    <ViewToggle v-model="viewMode" />

    <!-- Views with transition -->
    <Transition :name="viewTransition" mode="out-in">
      <SandboxCanvas
        v-if="viewMode === 'canvas'"
        key="canvas"
        :disabled="!!activeProject"
        :projects="projects"
        v-slot="{ isVisible }"
      >
        <template v-for="project in projects" :key="project.id">
          <ProjectCard
            v-if="isVisible(project)"
            v-show="filter === 'all' || project.type === filter"
            :project="project"
            :visible="true"
            @open="openProject"
          />
        </template>
      </SandboxCanvas>

      <MasonryView
        v-else-if="viewMode === 'masonry'"
        key="masonry"
        :projects="filteredProjects"
        @open="openProject"
      />

      <ListView
        v-else
        key="list"
        :projects="filteredProjects"
        @open="openProject"
      />
    </Transition>

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
import type { ViewMode } from '~/components/ViewToggle.vue'

const activeProject = ref<Project | null>(null)
const filter = ref<FilterValue>('all')
const viewMode = ref<ViewMode>('canvas')
const viewTransition = ref('view-fade')
const sound = useSound()

// Track direction for transition
watch(viewMode, (to, from) => {
  const order: ViewMode[] = ['canvas', 'masonry', 'list']
  const fromIdx = order.indexOf(from)
  const toIdx = order.indexOf(to)
  viewTransition.value = toIdx > fromIdx ? 'view-slide-left' : 'view-slide-right'
})

// Fetch projects from API (R2-backed) — client-only
const projectsData = ref<Project[]>([])
const projects = computed(() => projectsData.value)
const loading = ref(true)
const error = ref(false)

const filteredProjects = computed(() => {
  if (filter.value === 'all') return projects.value
  return projects.value.filter(p => p.type === filter.value)
})

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

<style>
/* View transitions — directional slide + fade */
.view-slide-left-enter-active,
.view-slide-left-leave-active,
.view-slide-right-enter-active,
.view-slide-right-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.view-slide-left-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.view-slide-left-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

.view-slide-right-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}
.view-slide-right-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
