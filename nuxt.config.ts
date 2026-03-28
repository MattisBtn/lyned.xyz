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
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://lyned.xyz' },
        { property: 'og:title', content: 'LYNED — Creative Portfolio' },
        { property: 'og:description', content: 'Graphic Design, Motion Design, 3D & Web.' },
        { property: 'og:image', content: 'https://lyned.xyz/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'LYNED — Creative Portfolio' },
        { name: 'twitter:description', content: 'Graphic Design, Motion Design, 3D & Web.' },
        { name: 'twitter:image', content: 'https://lyned.xyz/og-image.png' },
      ],
      link: [
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
