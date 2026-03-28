import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-03-28',
  devtools: { enabled: false },
  ssr: false,
  vite: {
    plugins: [tailwindcss()],
  },
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
      },
      '/api/projects': {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      },
      '/_nuxt/**': {
        headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
      },
      '/sounds/**': {
        headers: { 'Cache-Control': 'public, max-age=86400' },
      },
      '/cursors/**': {
        headers: { 'Cache-Control': 'public, max-age=86400' },
      },
    },
  },
  css: ['~/assets/css/tailwind.css'],
  app: {
    head: {
      title: 'LYNED — Creative Portfolio',
      htmlAttrs: { lang: 'fr' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'LYNED — Portfolio créatif : Graphic Design, Motion Design, 3D & Web.' },
        { name: 'theme-color', content: '#0a0a0f' },
        { name: 'msapplication-TileColor', content: '#0a0a0f' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://lyned.xyz' },
        { property: 'og:title', content: 'LYNED — Creative Portfolio' },
        { property: 'og:description', content: 'Graphic Design, Motion Design, 3D & Web.' },
        { property: 'og:image', content: 'https://lyned.xyz/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'LYNED — Creative Portfolio' },
        { name: 'twitter:description', content: 'Graphic Design, Motion Design, 3D & Web.' },
        { name: 'twitter:image', content: 'https://lyned.xyz/og-image.png' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://pub-a27b973d02cf433a8b0ddc93d41c22f9.r2.dev', crossorigin: '' },
        { rel: 'dns-prefetch', href: 'https://pub-a27b973d02cf433a8b0ddc93d41c22f9.r2.dev' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },
})
