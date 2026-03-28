<template>
  <div>
    <!-- Header -->
    <header class="fixed top-0 left-0 z-30 p-5">
      <img src="/logo.svg" alt="LYNED" class="h-5 opacity-90" draggable="false" />
    </header>

    <!-- Sound toggle (top right) -->
    <SoundToggle />

    <!-- Filter dropdown (bottom left) -->
    <FilterDropdown v-model="filter" />

    <!-- Sandbox (v-show keeps layout intact when filtering) -->
    <SandboxCanvas :disabled="!!activeProject" v-slot="{ isVisible }">
      <ProjectCard
        v-for="project in projects"
        :key="project.id"
        v-show="filter === 'all' || project.type === filter"
        :project="project"
        :visible="isVisible(project)"
        @open="openProject"
      />
    </SandboxCanvas>

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
import { projects, type Project } from '~/data/projects'
import type { FilterValue } from '~/components/FilterDropdown.vue'

const activeProject = ref<Project | null>(null)
const filter = ref<FilterValue>('all')
const sound = useSound()

function openProject(project: Project) {
  sound.open()
  activeProject.value = project
}

function closeProject() {
  sound.close()
  activeProject.value = null
}
</script>
