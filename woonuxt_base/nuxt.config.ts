import { createResolver } from '@nuxt/kit';
const { resolve } = createResolver(import.meta.url);

export default defineNuxtConfig({
  compatibilityDate: '2025-03-30',
  future: {
    compatibilityVersion: 4,
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [{ rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
    },
    pageTransition: { name: 'page', mode: 'default' },
  },

  experimental: {
    sharedPrerenderData: true,
    buildCache: true,
    defaults: {
      nuxtLink: {
        prefetch: true,
      },
    },
  },

  plugins: [
    resolve('./app/plugins/init.ts'),
    resolve('./app/plugins/graphql.ts')
  ],

  components: [{ path: resolve('./app/components'), pathPrefix: false }],

  modules: ['woonuxt-settings', 'nuxt-graphql-client', '@nuxtjs/tailwindcss', '@nuxt/icon', '@nuxt/image', '@nuxtjs/i18n'],

  'graphql-client': {
    codegen: {
      avoidOptionals: true,
    },
    clients: {
      default: {
        host: process.env.GQL_HOST || 'http://localhost:4000/graphql',
        corsOptions: { mode: 'cors', credentials: 'include' },
        headers: { Origin: process.env.APP_HOST || 'http://localhost:3000' },
      },
    },
    autoImport: true,
  },

  alias: {
    '#constants': resolve('./app/constants'),
    '#woo': '../.nuxt/gql/default',
  },

  hooks: {
    'pages:extend'(pages) {
      const addPage = (name: string, path: string, file: string) => {
        pages.push({ name, path, file: resolve(`./app/pages/${file}`) });
      };

      addPage('product-page-pager', '/store/:slug/products/page/:pageNumber', 'store/[slug]/products.vue');
      addPage('product-category-page', '/store/:slug/product-category/:categorySlug', 'store/[slug]/product-category/[categorySlug].vue');
      addPage('product-category-page-pager', '/store/:slug/product-category/:categorySlug/page/:pageNumber', 'store/[slug]/product-category/[categorySlug].vue');
      addPage('order-received', '/store/:slug/checkout/order-received/:orderId', 'store/[slug]/order-summary.vue');
      addPage('order-summary', '/store/:slug/order-summary/:orderId', 'store/[slug]/order-summary.vue');
    },
  },

  nitro: {
    routeRules: {
      '/store/*/checkout/order-received/**': { ssr: false },
      '/store/*/order-summary/**': { ssr: false },
    },
  },

  // Multilingual support
  i18n: {
    locales: [
      { code: 'en_US', file: 'en-US.json', name: 'English 🇺🇸' },
      { code: 'de_DE', file: 'de-DE.json', name: 'Deutsch 🇩🇪' },
      { code: 'es_ES', file: 'es-ES.json', name: 'Español 🇪🇸' },
      { code: 'fr_FR', file: 'fr-FR.json', name: 'Français 🇫🇷' },
      { code: 'it_IT', file: 'it-IT.json', name: 'Italiano 🇮🇹' },
      { code: 'pt_BR', file: 'pt-BR.json', name: 'Português 🇧🇷' },
    ],
    langDir: 'locales',
    defaultLocale: 'en_US',
    strategy: 'no_prefix',
    restructureDir: false,
  },
});
