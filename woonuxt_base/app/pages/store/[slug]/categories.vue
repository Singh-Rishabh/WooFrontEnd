<template>
  <div class="container">
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">Loading categories...</p>
    </div>
    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-600">{{ error }}</p>
      <button 
        @click="retryLoading" 
        class="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
      >
        Retry
      </button>
    </div>
    <div v-else>
      <header class="mb-8">
        <h1 class="text-3xl font-bold">{{ $t('messages.shop.shopByCategory') }}</h1>
        <p class="text-gray-600 mt-2">Browse all product categories from {{ currentStore?.site_name }}</p>
      </header>

      <div v-if="categories.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        <CategoryCard 
          v-for="category in categories" 
          :key="category.databaseId" 
          :node="category" 
          class="w-full"
        />
      </div>
      <div v-else class="text-center py-16">
        <h2 class="text-xl font-semibold text-gray-600 mb-4">No Categories Found</h2>
        <p class="text-gray-500">This store doesn't have any product categories yet.</p>
        <NuxtLink 
          :to="'/store/' + storeSlug" 
          class="inline-block mt-6 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Back to Store
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNuxtApp } from '#app'
import { useStoreManager, getStoreSlugFromUrl } from '../../../composables/useStoreManager'

// Define page meta
definePageMeta({
  name: 'store-slug-categories'
})

const route = useRoute()
const router = useRouter()
const nuxtApp = useNuxtApp()

const storeSlug = computed(() => route.params.slug as string)

// Store management
const { currentStore, setCurrentStore, stores, fetchStores, getStoreSlugFromUrl: getSlugFromUrl } = useStoreManager()

// Component state
const categories = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

console.log('📂 Categories page loading for store:', storeSlug.value)

const retryLoading = async () => {
  error.value = null
  await loadCategories()
}

const loadCategories = async () => {
  try {
    loading.value = true
    error.value = null

    // Initialize store if needed
    if (!currentStore.value) {
      console.log('🏪 Initializing store for categories page...')
      if (!stores.value.length) {
        await fetchStores()
      }
      
      const store = stores.value.find((s: any) => 
        getSlugFromUrl(s.site_url) === storeSlug.value
      )
      
      if (store) {
        await setCurrentStore(store)
      } else {
        throw new Error('Store not found')
      }
    }

    // Fetch categories using GraphQL
    const gql = nuxtApp.$gql as any
    if (!gql?.default) {
      throw new Error('GraphQL client not available')
    }

    const categoriesQuery = `
      query GetAllCategories($first: Int!) {
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

    const result = await gql.default.query(categoriesQuery, { first: 50 })
    
    if (result.data?.productCategories?.nodes) {
      categories.value = result.data.productCategories.nodes
      console.log('✅ Categories loaded:', categories.value.length)
    } else {
      console.warn('⚠️ No categories data in response')
    }
  } catch (err) {
    console.error('❌ Error loading categories:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load categories'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCategories()
})

// SEO
useHead({
  title: `Categories - ${currentStore.value?.site_name || storeSlug.value}`,
  meta: [
    { name: 'description', content: `Browse all product categories from ${currentStore.value?.site_name || storeSlug.value}` }
  ]
})
</script>

<style scoped>
.bg-primary {
  background-color: #ff5733;
}

.bg-primary-dark {
  background-color: #e64a2e;
}

.text-primary {
  color: #ff5733;
}
</style> 