<template>
  <main class="content">
    <h1>Dither Background Demo</h1>
    <p>Animated dithering effect inspired by Base's "Connection" brand site.</p>
    <div class="card">
      <h2>WebGL2 Multi-Pass Pipeline</h2>
      <ul>
        <li><strong>Pass 1</strong> &mdash; FBM clouds with navy/green palette</li>
        <li><strong>Pass 2</strong> &mdash; 8&times;8 Bayer ordered dithering</li>
      </ul>
    </div>
  </main>
</template>

<style scoped>
.content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: rgba(0, 0, 0, 0.85);
  font-family: system-ui, -apple-system, sans-serif;
  text-align: center;
}

h1 {
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}

p {
  font-size: 1.1rem;
  opacity: 0.7;
  margin-bottom: 2rem;
}

.card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 1.5rem 2rem;
  text-align: left;
  max-width: 420px;
}

.card h2 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.card ul {
  list-style: none;
  padding: 0;
}

.card li {
  padding: 0.3rem 0;
  font-size: 0.9rem;
  opacity: 0.8;
}
</style>
