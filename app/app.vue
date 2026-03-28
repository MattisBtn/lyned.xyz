<template>
  <div>
    <Preloader @done="preloaderDone = true" />
    <DitherBackground v-if="preloaderDone" />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const preloaderDone = ref(false)
</script>
