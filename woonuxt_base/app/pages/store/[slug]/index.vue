<template>
  <main>
    <div v-if="!currentStore" class="container mx-auto px-4 py-8 text-center">
      <p class="text-gray-600">Loading store...</p>
    </div>
    <template v-else>
      <header class="bg-white shadow-sm mb-8">
        <div class="container mx-auto px-4 py-6">
          <h1 class="text-3xl font-bold">{{ currentStore.site_name }}</h1>
        </div>
      </header>

      <div class="container flex flex-wrap items-center justify-center my-16 text-center gap-x-8 gap-y-4 brand lg:justify-between">
        <img src="/images/logoipsum-211.svg" alt="Brand 1" width="132" height="35" />
        <img src="/images/logoipsum-221.svg" alt="Brand 2" width="119" height="30" />
        <img src="/images/logoipsum-225.svg" alt="Brand 3" width="49" height="48" />
        <img src="/images/logoipsum-280.svg" alt="Brand 4" width="78" height="30" />
        <img src="/images/logoipsum-284.svg" alt="Brand 5" width="70" height="44" />
        <img src="/images/logoipsum-215.svg" alt="Brand 6" width="132" height="40" />
      </div>

      <section class="container my-16" v-if="categories.length">
        <div class="flex items-end justify-between">
          <h2 class="text-lg font-semibold md:text-2xl">{{ $t('messages.shop.shopByCategory') }}</h2>
          <NuxtLink 
            class="text-primary" 
            :to="'/store/' + storeSlug + '/categories'"
          >
            {{ $t('messages.general.viewAll') }}
          </NuxtLink>
        </div>
        <div class="grid justify-center grid-cols-2 gap-4 mt-8 md:grid-cols-3 lg:grid-cols-6">
          <CategoryCard v-for="category in categories" :key="category.databaseId" class="w-full" :node="category" />
        </div>
      </section>

      <section class="container grid gap-4 my-24 md:grid-cols-2 lg:grid-cols-4">
        <div class="flex items-center gap-8 p-8 bg-white rounded-lg">
          <img src="/icons/box.svg" width="60" height="60" alt="Free Shipping" loading="lazy" />
          <div>
            <h3 class="text-xl font-semibold">Free Shipping</h3>
            <p class="text-sm">Free shipping on order over €50</p>
          </div>
        </div>
        <div class="flex items-center gap-8 p-8 bg-white rounded-lg">
          <img src="/icons/moneyback.svg" width="60" height="60" alt="Money Back" loading="lazy" />
          <div>
            <h3 class="text-xl font-semibold">Peace of Mind</h3>
            <p class="text-sm">30 days money back guarantee</p>
          </div>
        </div>
        <div class="flex items-center gap-8 p-8 bg-white rounded-lg">
          <img src="/icons/secure.svg" width="60" height="60" alt="Secure Payment" loading="lazy" />
          <div>
            <h3 class="text-xl font-semibold">100% Payment Secure</h3>
            <p class="text-sm">Your payment are safe with us.</p>
          </div>
        </div>
        <div class="flex items-center gap-8 p-8 bg-white rounded-lg">
          <img src="/icons/support.svg" width="60" height="60" alt="Support 24/7" loading="lazy" />
          <div>
            <h3 class="text-xl font-semibold">Support 24/7</h3>
            <p class="text-sm">24/7 Online support</p>
          </div>
        </div>
      </section>

      <section class="container my-16" v-if="products.length">
        <div class="flex items-end justify-between">
          <h2 class="text-lg font-semibold md:text-2xl">{{ $t('messages.shop.popularProducts') }}</h2>
          <NuxtLink 
            class="text-primary" 
            :to="'/store/' + storeSlug + '/products'"
            @click="debugProductsNavigation"
          >
            {{ $t('messages.general.viewAll') }}
          </NuxtLink>
        </div>
        <ProductRow :products="products" class="grid-cols-2 md:grid-cols-4 lg:grid-cols-5 mt-8" />
      </section>

      <div v-if="loading" class="text-center py-8">
        <p class="text-gray-600">Loading store data...</p>
      </div>
      
      <div v-if="error" class="text-center py-8">
        <p class="text-red-600">{{ error }}</p>
        <button 
          @click="retryLoading" 
          class="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
        >
          Retry Loading
        </button>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNuxtApp } from '#app'
import { useStoreManager, getStoreSlugFromUrl } from '../../../composables/useStoreManager'
import type { GqlInstance } from '../../../composables/useStoreManager'
import { ProductsOrderByEnum } from '#woo'

interface Store {
  site_id: number
  site_url: string
  site_name: string
  admin_email: string
  language: string
}

interface Category {
  databaseId: number;
  [key: string]: any;
}

interface Product {
  databaseId: number;
  [key: string]: any;
}

// Component setup - Remove restrictive validation
definePageMeta({
  name: 'store-slug-index'
})

const route = useRoute()
const router = useRouter()
const nuxtApp = useNuxtApp()

// Get the store slug from the route
const storeSlug = computed(() => route.params.slug as string)

// Store manager setup
const { stores, currentStore, loading: storeLoading, error: storeError, fetchStores, setCurrentStore } = useStoreManager()

// Component state
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const isInitialized = ref(false)

// Debug log for component setup
console.log('🔄 Store index page component setup started')

const getStoreSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Add retry functionality
const retryLoading = async () => {
  console.log('Retrying data load...')
  error.value = null
  await loadStoreData()
}

const loadStoreData = async () => {
  console.log('🔄 loadStoreData called')
  if (!currentStore.value) {
    console.error('❌ No current store set')
    error.value = 'Store not initialized'
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log('📍 Loading data for store:', currentStore.value.site_name)
    
    // Get GraphQL client
    const gql = nuxtApp.$gql as GqlInstance
    if (!gql?.default) {
      console.error('❌ GraphQL client not available:', gql)
      throw new Error('GraphQL client not initialized')
    }

    // Fetch categories with error handling
    console.log('📂 Fetching categories...')
    try {
      const categoriesQuery = `
        query GetCategories($first: Int!) {
          productCategories(first: $first) {
            nodes {
              id
              databaseId
              name
              slug
              description
              image {
                id
                sourceUrl
                altText
              }
              count
            }
          }
        }
      `
      const categoriesResult = await gql.default.query(categoriesQuery, { first: 6 })
      console.log('📥 Categories result received')
      
      if (categoriesResult.data?.productCategories?.nodes) {
        categories.value = categoriesResult.data.productCategories.nodes
        console.log('✅ Categories loaded:', categories.value.length)
      } else {
        console.warn('⚠️ No categories data in response')
      }
    } catch (categoryError) {
      console.error('❌ Error fetching categories:', categoryError)
      error.value = 'Failed to load categories'
    }

    // Fetch popular products with error handling
    console.log('📦 Fetching products...')
    try {
      const productsQuery = `
        query GetProducts($first: Int!) {
          products(first: $first) {
            nodes {
              id
              databaseId
              name
              type
              slug
              description
              shortDescription
              image {
                id
                sourceUrl
                producCardSourceUrl: sourceUrl(size: WOOCOMMERCE_THUMBNAIL)
                altText
                title
              }
              ... on SimpleProduct {
                price
                regularPrice
                salePrice
              }
              ... on VariableProduct {
                price
                regularPrice
                salePrice
              }
            }
          }
        }
      `
      const productsResult = await gql.default.query(productsQuery, { first: 5 })
      console.log('📥 Products result received')
      
      if (productsResult.data?.products?.nodes) {
        products.value = productsResult.data.products.nodes
        console.log('✅ Products loaded:', products.value.length)
      } else {
        console.warn('⚠️ No products data in response')
      }
    } catch (productError) {
      console.error('❌ Error fetching products:', productError)
      error.value = error.value ? `${error.value}; Failed to load products` : 'Failed to load products'
    }

  } catch (err) {
    console.error('❌ Critical error loading store data:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load store data'
  } finally {
    loading.value = false
    console.log('🏁 Data loading completed. Status:', {
      categoriesLoaded: categories.value.length,
      productsLoaded: products.value.length,
      hasError: !!error.value
    })
  }
}

const findStoreBySlug = async (slug: string) => {
  console.log('🔍 Finding store by slug:', slug)
  
  if (!stores.value.length) {
    console.log('📡 Fetching stores first...')
    await fetchStores()
  }
  
  // Find store by URL-based slug instead of name-based slug
  const foundStore = stores.value.find((store: Store) => {
    const storeSlug = getStoreSlugFromUrl(store.site_url)
    console.log('🔍 Comparing slugs:', { storeSlug, targetSlug: slug, siteUrl: store.site_url })
    return storeSlug === slug
  })
  
  if (foundStore) {
    console.log('✅ Found store:', foundStore.site_name)
    return foundStore
  } else {
    console.log('❌ Store not found for slug:', slug)
    console.log('Available stores:', stores.value.map((s: Store) => ({ 
      name: s.site_name, 
      slug: getStoreSlugFromUrl(s.site_url),
      url: s.site_url 
    })))
    return null
  }
}

const initializeStore = async () => {
  if (isInitialized.value) {
    console.log('Store already initialized, skipping...')
    return
  }

  console.log('🔄 Initializing store with slug:', storeSlug.value)
  
  try {
    // Find store in existing stores or fetch if needed
    let store = await findStoreBySlug(storeSlug.value)
    
    if (store) {
      console.log('✅ Found matching store:', store.site_name)
      await setCurrentStore(store)
      console.log('🔄 Triggering data load after store set')
      await loadStoreData()
      isInitialized.value = true
    } else {
      console.error('❌ Store not found for slug:', storeSlug.value)
      error.value = 'Store not found'
      router.push('/')
    }
  } catch (err) {
    console.error('❌ Error in store initialization:', err)
    error.value = 'Failed to initialize store'
  }
}

// Delayed initialization function
const delayedInit = () => {
  setTimeout(async () => {
    console.log('🕒 Delayed initialization starting...')
    await initializeStore()
  }, 100) // Small delay to ensure store manager is ready
}

// Replace the process.client check with proper setup
onMounted(async () => {
  console.log('🔄 Store index page mounted')
  if (!currentStore.value || getStoreSlug(currentStore.value.site_name) !== storeSlug.value) {
    console.log('🔄 No current store or different store, initializing...')
    await delayedInit()
  } else {
    console.log('🔄 Store already set, loading data...')
    await loadStoreData()
  }
})

// Update watchers
watch(storeSlug, async (newSlug, oldSlug) => {
  if (newSlug && newSlug !== oldSlug) {
    console.log('🔄 Store slug changed:', { from: oldSlug, to: newSlug })
    isInitialized.value = false
    await delayedInit()
  }
}, { immediate: true })

// Watch for store changes
watch(currentStore, async (newStore, oldStore) => {
  if (newStore && !isInitialized.value) {
    console.log('🔄 Current store changed:', newStore.site_name)
    await loadStoreData()
    isInitialized.value = true
  }
}, { immediate: true })

// Update SEO meta
useSeoMeta({
  title: currentStore.value?.site_name || 'Loading Store...',
  description: `Browse products from ${currentStore.value?.site_name}`,
})

const debugProductsNavigation = () => {
  console.log('🔄 Debug products navigation called')
  // Add any necessary debugging logic here
}
</script>

<style scoped>
main {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.bg-primary {
  background-color: #ff5733;
}

.bg-primary-dark {
  background-color: #e64a2e;
}

.brand img {
  max-height: min(8vw, 120px);
  object-fit: contain;
  object-position: center;
}
</style> 