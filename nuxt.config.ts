import { cjsInterop } from 'vite-plugin-cjs-interop'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: ['@nuxt/ui-pro'],

  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxthq/studio',
    '@vueuse/nuxt',
    'nuxt-og-image',
    '@nuxt/scripts'
  ],

  hooks: {
    // Define `@nuxt/ui` components as global to use them in `.md` (feel free to add those you need)
    'components:extend': (components) => {
      const globals = components.filter(c => ['UButton'].includes(c.pascalName))

      globals.forEach(c => c.global = true)
    }
  },

  ui: {
    icons: ['heroicons', 'simple-icons']
  },

  colorMode: {
    disableTransition: true
  },

  routeRules: {
    '/:avalancheCenter/home/**': { isr: true },
    '/:avalancheCenter/about/**': { isr: true },
    '/:avalancheCenter/observations/**': { isr: true },
    '/:avalancheCenter/forecast/**': { isr: true },
    '/api/**': { cors: true },
  },

  devtools: {
    enabled: true
  },

  typescript: {
    strict: true
  },

  future: {
    compatibilityVersion: 4
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  image: {
    contentful: {}
  },

  vite: {
    plugins: [
      cjsInterop({
        dependencies: [
          'contentful'
        ]
      })
    ]
  },

  runtimeConfig: {
    supportedCenters: ['NWAC', 'SNFAC', 'SAC'],
    defaultCenter: 'NWAC',

    contentful: {
      spaceId: process.env.CONTENTFUL_SPACE_ID,
      environment: process.env.CONTENTFUL_ENVIRONMENT,
      apiAccessToken: process.env.CONTENTFUL_CONTENT_DELIVERY_API_ACCESS_TOKEN
    }
  },

  compatibilityDate: '2024-07-11'
})