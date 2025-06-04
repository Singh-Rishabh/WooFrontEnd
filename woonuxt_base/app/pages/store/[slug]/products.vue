<template>
    <div class="container flex items-start gap-16" v-if="products?.length">
      <Filters v-if="storeSettings.showFilters" />

      <div class="w-full">
        <div class="flex items-center justify-between w-full gap-4 mt-8 md:gap-8">
          <ProductResultCount />
          <OrderByDropdown class="hidden md:inline-flex" v-if="storeSettings.showOrderByDropdown" />
          <ShowFilterTrigger v-if="storeSettings.showFilters" class="md:hidden" />
        </div>
        <ProductGrid />
      </div>
    </div>
    <NoProductsFound v-else>Could not fetch products from your store. Please check your configuration.</NoProductsFound>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStoreManager, getStoreSlugFromUrl } from '../../../composables/useStoreManager'

// Define page meta with explicit validation
definePageMeta({
  name: 'store-slug-products',
  validate: async (route) => {
    console.log('🔍 Route validation called for products page:', {
      path: route.path,
      params: route.params,
      name: route.name
    })
    
    // Always return true for now to see if validation is the issue
    return true
  }
})

console.log('🏪 Products page: Script setup started')

const route = useRoute()
const storeSlug = route.params.slug as string

console.log('🏪 Products page: Route params:', {
  slug: storeSlug,
  fullPath: route.fullPath,
  name: route.name,
  params: route.params
})

// Composables
const { setProducts, products } = useProducts()
const { storeSettings } = useAppConfig()

console.log('🏪 Products page: Composables loaded')

// Store management
const { currentStore, setCurrentStore, stores, fetchStores, fetchStoreProducts } = useStoreManager()

console.log('🏪 Products page: Store manager initialized', {
  currentStore: currentStore.value?.site_name || 'None',
  storesLoaded: stores.value.length
})

// Initialize store and load products
onMounted(async () => {
  console.log('🏪 Products page: onMounted called')
  
  try {
    if (!currentStore.value) {
      console.log('🏪 Products page: No current store, fetching stores...')
      
      if (!stores.value.length) {
        console.log('🏪 Products page: Fetching stores from API...')
        await fetchStores()
        console.log('🏪 Products page: Stores fetched:', stores.value.length)
      }
      
      const store = stores.value.find((s: any) => 
        getStoreSlugFromUrl(s.site_url) === storeSlug
      )
      
      if (store) {
        console.log('🏪 Products page: Found matching store:', store.site_name)
        await setCurrentStore(store)
        console.log('🏪 Products page: Current store set')
      } else {
        console.error('🏪 Products page: No matching store found for slug:', storeSlug)
        console.log('🏪 Products page: Available stores:', stores.value.map(s => ({
          name: s.site_name,
          slug: getStoreSlugFromUrl(s.site_url),
          url: s.site_url
        })))
        return
      }
    } else {
      console.log('🏪 Products page: Current store already set:', currentStore.value.site_name)
    }

    // Fetch products
    if (currentStore.value) {
      console.log('🏪 Products page: Fetching products for store:', currentStore.value.site_name)
      try {
        const fetchedProducts = await fetchStoreProducts(currentStore.value, 50)
        console.log('🏪 Products page: Products fetched:', fetchedProducts.length)
        
        // Set products for the global state
        setProducts(fetchedProducts)
        console.log('🏪 Products page: Products set in global state')
        console.log('🏪 Products page: Global products state now:', products.value.length)
      } catch (error) {
        console.error('🏪 Products page: Error fetching products:', error)
      }
    } else {
      console.error('🏪 Products page: No current store available for fetching products')
    }

    console.log('🏪 Products page: Final state:', {
      currentStore: currentStore.value?.site_name || 'None',
      productsCount: products.value.length,
      storeSlug
    })
  } catch (error) {
    console.error('🏪 Products page: Error in onMounted:', error)
  }
})

useHead({
  title: `Products - ${currentStore.value?.site_name || storeSlug}`,
  meta: [{ name: 'description', content: `All products from ${currentStore.value?.site_name || storeSlug}` }],
})

console.log('🏪 Products page: Setup completed')
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