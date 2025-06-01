<template>
  <div class="container">
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">Loading category...</p>
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
    <div v-else-if="category">
      <header class="mb-8">
        <h1 class="text-3xl font-bold mb-4">{{ category.name }}</h1>
        <div v-if="category.description" v-html="category.description" class="text-gray-600"></div>
      </header>

      <div v-if="products.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <ProductCard 
          v-for="product in products" 
          :key="product.databaseId" 
          :node="product" 
          class="w-full"
        />
      </div>
      <div v-else class="text-center py-8">
        <p class="text-gray-600">No products found in this category</p>
      </div>
      
      <!-- Debug info -->
      <div class="mt-8 p-4 bg-gray-100 rounded">
        <h3 class="font-bold">Debug Info:</h3>
        <p>Store: {{ storeSlug }}</p>
        <p>Category: {{ categorySlug }}</p>
        <p>Route: {{ route.fullPath }}</p>
        <p>Products found: {{ products.length }}</p>
      </div>
    </div>
    <div v-else class="text-center py-8">
      <p class="text-gray-600">Category not found</p>
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
  name: 'store-slug-product-category-slug'
})

const route = useRoute()
const router = useRouter()
const nuxtApp = useNuxtApp()

const storeSlug = route.params.slug as string
const categorySlug = Array.isArray(route.params.slug) ? route.params.slug[1] : route.params.slug

console.log('📂 Category page loading:', { storeSlug, categorySlug, params: route.params })

// Store management
const { currentStore, setCurrentStore, stores, fetchStores, getStoreSlugFromUrl: getSlugFromUrl } = useStoreManager()

// Component state
const category = ref<any>(null)
const products = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const retryLoading = async () => {
  error.value = null
  await loadCategoryAndProducts()
}

const loadCategoryAndProducts = async () => {
  try {
    loading.value = true
    error.value = null

    // Initialize store if needed
    if (!currentStore.value) {
      console.log('🏪 Initializing store for category page...')
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

    // Fetch category and products using GraphQL
    const gql = nuxtApp.$gql as any
    if (!gql?.default) {
      throw new Error('GraphQL client not available')
    }

    // First, get the category
    const categoryQuery = `
      query GetCategory($slug: ID!) {
        productCategory(id: $slug, idType: SLUG) {
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
    `

    const categoryResult = await gql.default.query(categoryQuery, { slug: categorySlug })
    
    if (categoryResult.data?.productCategory) {
      category.value = categoryResult.data.productCategory
      console.log('✅ Category loaded:', category.value.name)

      // Now fetch products in this category
      const productsQuery = `
        query GetProductsByCategory($categoryId: Int!, $first: Int!) {
          products(where: { categoryId: $categoryId }, first: $first) {
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

      const productsResult = await gql.default.query(productsQuery, { 
        categoryId: category.value.databaseId,
        first: 20 
      })
      
      if (productsResult.data?.products?.nodes) {
        products.value = productsResult.data.products.nodes
        console.log('✅ Products loaded:', products.value.length)
      }
    } else {
      error.value = 'Category not found'
    }
  } catch (err) {
    console.error('❌ Error loading category:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load category'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCategoryAndProducts()
})

// SEO
useHead({
  title: category.value?.name ? `${category.value.name} - ${storeSlug}` : `Category - ${storeSlug}`,
  meta: [
    { name: 'description', content: category.value?.description || `Products in ${categorySlug} category from ${storeSlug}` }
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