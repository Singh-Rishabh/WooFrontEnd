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

  runtimeConfig: {
    public: {
      CURRENCY_SYMBOL: '₹',
      CURRENCY_CODE: 'INR',
      MAX_PRICE: 100000, // Adjusted for Indian Rupees (100k INR instead of 1k USD)
    },
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
      console.log(`🛣️ Starting route extension. Initial pages: ${pages.length}`);
      
      const addPage = (name: string, path: string, file: string) => {
        const fullPath = resolve(`./app/pages/${file}`);
        console.log(`🛣️ Adding route: ${name} -> ${path} (${file})`);
        console.log(`🛣️ Full file path: ${fullPath}`);
        pages.push({ name, path, file: fullPath });
      };

      // Remove manual store routes - let file-based routing handle them
      // addPage('manual-store-products', '/store/:slug/products', 'store/[slug]/products.vue');
      // addPage('manual-store-categories', '/store/:slug/categories', 'store/[slug]/categories.vue');
      // addPage('manual-store-wishlist', '/store/:slug/wishlist', 'store/[slug]/wishlist.vue');
      
      // Keep only the pagination and special routes that file-based routing can't handle
      addPage('product-page-pager', '/store/:slug/products/page/:pageNumber', 'store/[slug]/products.vue');
      addPage('product-category-page', '/store/:slug/product-category/:categorySlug', 'store/[slug]/product-category/[categorySlug].vue');
      addPage('product-category-page-pager', '/store/:slug/product-category/:categorySlug/page/:pageNumber', 'store/[slug]/product-category/[categorySlug].vue');
      addPage('order-received', '/store/:slug/checkout/order-received/:orderId', 'store/[slug]/order-summary.vue');
      addPage('order-summary', '/store/:slug/order-summary/:orderId', 'store/[slug]/order-summary.vue');
      
      // Add explicit routes with required parameters to override file-based optional parameters
      addPage('explicit-store-products', '/store/:slug/products', 'store/[slug]/products.vue');
      addPage('explicit-store-categories', '/store/:slug/categories', 'store/[slug]/categories.vue');
      addPage('explicit-store-wishlist', '/store/:slug/wishlist', 'store/[slug]/wishlist.vue');
      addPage('explicit-store-contact', '/store/:slug/contact', 'store/[slug]/contact.vue');
      
      console.log(`🛣️ Total pages after custom routes: ${pages.length}`);
      console.log('🛣️ Store-related pages:', pages.filter(p => p.path?.includes('/store/')).map(p => ({ name: p.name, path: p.path })));
    },
  },

  nitro: {
    routeRules: {
      '/store/*/checkout/order-received/**': { ssr: false },
      '/store/*/order-summary/**': { ssr: false },
      '/store/*/products': { ssr: true },
      '/store/*/categories': { ssr: true },
      '/store/*/wishlist': { ssr: true },
      '/store/*/contact': { ssr: true },
    },
  },

  // Multilingual support
  i18n: {
    locales: [
      { code: 'en_US', file: 'en-US.json', name: 'English 🇺🇸' },
    ],
    langDir: 'locales',
    defaultLocale: 'en_US',
    strategy: 'no_prefix',
    restructureDir: false,
  },
});
