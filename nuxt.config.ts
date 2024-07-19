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
    'nuxt-og-image'
  ],

  ui: {
    icons: ['heroicons', 'simple-icons']
  },

  colorMode: {
    disableTransition: true
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
