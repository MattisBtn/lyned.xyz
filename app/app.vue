<template>
  <div>
    <Preloader @done="preloaderDone = true" />
    <DitherBackground />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const preloaderDone = ref(false)
</script>
