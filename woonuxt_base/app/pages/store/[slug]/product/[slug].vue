<template>
  <div class="container">
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">Loading product...</p>
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
    <div v-else-if="product">
      <h1 class="text-3xl font-bold mb-4">{{ product.name }}</h1>
      <div class="grid md:grid-cols-2 gap-8">
        <div v-if="product.image">
          <img 
            :src="product.image.sourceUrl" 
            :alt="product.image.altText || product.name"
            class="w-full rounded-lg"
          />
        </div>
        <div>
          <div v-if="product.price" class="text-2xl font-bold text-primary mb-4">
            {{ product.price }}
          </div>
          <div v-if="product.shortDescription" v-html="product.shortDescription" class="mb-6"></div>
          <div v-if="product.description" v-html="product.description"></div>
        </div>
      </div>
      
      <!-- Debug info -->
      <div class="mt-8 p-4 bg-gray-100 rounded">
        <h3 class="font-bold">Debug Info:</h3>
        <p>Store: {{ storeSlug }}</p>
        <p>Product: {{ productSlug }}</p>
        <p>Route: {{ route.fullPath }}</p>
      </div>
    </div>
    <div v-else class="text-center py-8">
      <p class="text-gray-600">Product not found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNuxtApp } from '#app'
import { useStoreManager, getStoreSlugFromUrl } from '../../../../composables/useStoreManager'

// Define page meta
definePageMeta({
  name: 'store-slug-product-slug'
})

const route = useRoute()
const router = useRouter()
const nuxtApp = useNuxtApp()

const storeSlug = route.params.slug as string
const productSlug = Array.isArray(route.params.slug) ? route.params.slug[1] : route.params.slug

console.log('📦 Product page loading:', { storeSlug, productSlug, params: route.params })

// Store management
const { currentStore, setCurrentStore, stores, fetchStores, getStoreSlugFromUrl: getSlugFromUrl } = useStoreManager()

// Component state
const product = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const retryLoading = async () => {
  error.value = null
  await loadProduct()
}

const loadProduct = async () => {
  try {
    loading.value = true
    error.value = null

    // Initialize store if needed
    if (!currentStore.value) {
      console.log('🏪 Initializing store for product page...')
      if (!stores.value.length) {
        await fetchStores()
      }
      
      const store = stores.value.find((s: any) => 
        getSlugFromUrl(s.site_url) === storeSlug
      )
      
      if (store) {
        await setCurrentStore(store)
      } else {
        throw new Error('Store not found')
      }
    }

    // Fetch product using GraphQL
    const gql = nuxtApp.$gql as any
    if (!gql?.default) {
      throw new Error('GraphQL client not available')
    }

    const productQuery = `
      query GetProduct($slug: ID!) {
        product(id: $slug, idType: SLUG) {
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
    `

    const result = await gql.default.query(productQuery, { slug: productSlug })
    
    if (result.data?.product) {
      product.value = result.data.product
      console.log('✅ Product loaded:', product.value.name)
    } else {
      error.value = 'Product not found'
    }
  } catch (err) {
    console.error('❌ Error loading product:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load product'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProduct()
})

// SEO
useHead({
  title: product.value?.name || `Product - ${storeSlug}`,
  meta: [
    { name: 'description', content: product.value?.shortDescription || `Product from ${storeSlug}` }
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