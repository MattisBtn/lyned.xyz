# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (default port 3333)
npm run build    # Production build
npm run preview  # Preview production build
```

## Stack

Nuxt 4.4 / Vue 3.5 / Tailwind CSS 4 (Vite plugin) / TypeScript / WebGL2

No UI library. Custom components only. Font: TT Lakes Neue (WOFF2). Custom Marathon cursors (PNG).

## Architecture

Interactive portfolio sandbox — infinite draggable canvas with project cards over a WebGL dithering background.

### Infinite Canvas Tiling (`SandboxCanvas.vue`)

The core pattern. Canvas bounds are computed from all project positions. The drag offset is wrapped via modulo, and a 3x3 tile grid is rendered around the current position. Only tiles overlapping the viewport (1-4 typically) are kept via `activeTiles` computed. Each tile is a scoped slot that receives `isVisible(project)` for lazy loading.

Drag uses unified `PointerEvent` (mouse+touch+pen) with momentum physics: velocity tracking during drag, friction decay (0.92) after release, lerp smoothing (0.15). The rAF loop auto-stops when converged and restarts on next interaction.

Click vs drag: 5px threshold via `provide('wasClick')` injected into ProjectCard.

### Video Lazy Loading (`ProjectCard.vue`)

Three-state lifecycle driven by a `watch(visible, ..., { immediate: true })`:
- **Visible**: mount `<video>` (`showVideo = true`), or resume `.play()`
- **Hidden**: `.pause()` immediately, start 10s unload timer
- **Unloaded**: `showVideo = false` removes `<video>` from DOM after 10s offscreen

Thumbnail `<img>` sits behind video as fallback. Video fades in via `opacity` transition on `loadeddata`.

### Filter System

`FilterDropdown` emits a `FilterValue` ('all' | 'image' | 'video'). Cards are filtered with `v-show` (not `v-if`) to preserve layout positions and avoid re-loading media. Canvas tile size always uses the full project set.

### Sound (`useSound.ts`)

Module-scoped `muted` ref + `cache` Map shared across all components. `forceClick()` bypasses mute check (used by SoundToggle so the click always plays on toggle). SSR returns no-ops. Preload runs once via a `preloaded` flag.

### WebGL Dithering (`DitherBackground.vue`)

Two-pass shader pipeline:
1. FBM clouds (4-octave noise + gaussian grain) → framebuffer
2. Bayer 8x8 ordered dithering at per-pixel resolution (color sampled at 4x4 blocks) → screen

Pauses on `visibilitychange`. Has `webglcontextlost`/`restored` handlers (reloads page on restore). DPR capped at 2x. Cleanup at top-level `onUnmounted`.

## Key Patterns

- **Positions are hardcoded** in `app/data/projects.ts` (x, y, width, height per project). Adding a project means picking coordinates that don't overlap.
- **Assets** live in `public/assets/graphic/` (WebP) and `public/assets/motion/` (MP4) with thumbnails in `public/assets/motion/thumbs/`. Committed directly (no LFS — Vercel doesn't support it).
- **Clip-path corners** are the design language: 8-10px on buttons, 12px on cards, 20px on modal. Class `clip-corner` in scoped styles.
- **Canvas disables** when modal is open via `:disabled` prop (adds `pointer-events-none`).
- **Cursor swap is intentional**: `.cursor-grab` uses the closed-hand image, `.cursor-grabbing` uses open-hand. This shows current state, not next action.

## Gotchas

- `v-show` filtered cards still play video in background (intentional — avoids reload on re-filter).
- The rAF loop in SandboxCanvas is NOT always-on. It stops when idle. If adding new reactive dependencies to the animation, call `ensureAnimating()`.
- WebGL shader null checks are important — `createProgram` can return null. Always guard.
- `useSound()` calls `onMounted` internally — only call it inside component `setup()`.
