// https://nuxt.com/docs/api/configuration/nuxt-config
import svgLoader from 'vite-svg-loader';
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-03-07',
  devtools: { enabled: true },
  features: {
    devLogs: false,
  },
  vite: {
    optimizeDeps: {
      include: ['@vueuse/core', '@tanstack/vue-query', 'radix-vue/nuxt'],
      esbuildOptions: {
        define: {
          global: 'window',
        },
      },
    },
    plugins: [svgLoader({ svgo: false }), tailwindcss()],
    css: {
      transformer: 'lightningcss',
    },
    build: {
      cssMinify: 'lightningcss',
    },
  },
  imports: {
    presets: [
      {
        from: 'tailwind-variants',
        imports: ['tv'],
      },
    ],
  },
  nitro: {
    compressPublicAssets: true,
  },
  runtimeConfig: {
    public: {
      pack: '',
    },
  },
  app: {
    head: {
      titleTemplate: 'UnPlugged: %s',
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content:
            'viewport-fit=cover, width=device-width, initial-scale=1, user-scalable=1, minimum-scale=1, maximum-scale=5',
        },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'theme-color', content: '#fff' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'alternate icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/icon-180.png' },
        { rel: 'manifest', href: '/manifest.json' },
      ],
    },
    pageTransition: false,
    layoutTransition: false,
  },
  css: ['~/assets/styles.css'],
  modules: [
    '@pinia/nuxt',
    '@nuxt/image',
    '@peterbud/nuxt-query',
    '@pinia-plugin-persistedstate/nuxt',
    'radix-vue/nuxt',
    '@nuxt/icon',
    '@nuxt/content',
  ],
  headlessui: {
    prefix: 'H',
  },
  nuxtQuery: {
    autoImports: ['useQuery', 'useMutation', 'useQueries'],
    devtools: true,
    queryClientOptions: {
      defaultOptions: {
        queries: {
          networkMode: 'always',
          staleTime: 60000 * 60 * 6,
          refetchOnWindowFocus: false,
        },
        mutations: {
          networkMode: 'always',
        },
      },
    },
  },
  typescript: {
    strict: true,
  },
  spaLoadingTemplate: false,
  experimental: {
    payloadExtraction: true,
    typedPages: true,
  },
});
