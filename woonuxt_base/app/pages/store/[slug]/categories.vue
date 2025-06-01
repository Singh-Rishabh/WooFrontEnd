<template>
  <main class="container">
    <div v-if="productCategories?.length" class="grid grid-cols-2 gap-4 my-6 md:grid-cols-3 lg:gap-8 xl:grid-cols-4">
      <CategoryCard v-for="(category, i) in productCategories" :key="i" :node="category" :image-loading="i <= 2 ? 'eager' : 'lazy'" />
    </div>
  </main>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { useStoreManager, getStoreSlugFromUrl } from '../../../composables/useStoreManager'

// Define page meta
definePageMeta({
  name: 'store-slug-categories'
})

const route = useRoute()
const storeSlug = route.params.slug as string

// Store management - Initialize store for this page
const { currentStore, setCurrentStore, stores, fetchStores, fetchStoreCategories } = useStoreManager()

// Initialize store if needed
if (!currentStore.value) {
  if (!stores.value.length) {
    await fetchStores()
  }
  
  const store = stores.value.find((s: any) => 
    getStoreSlugFromUrl(s.site_url) === storeSlug
  )
  
  if (store) {
    await setCurrentStore(store)
  }
}

// Fetch categories from the specific store using the store manager
let productCategories: ProductCategory[] = []
if (currentStore.value) {
  productCategories = await fetchStoreCategories(currentStore.value, 50)
}

useHead({
  title: `Categories - ${currentStore.value?.site_name || storeSlug}`,
  meta: [{ name: 'description', content: `All product categories from ${currentStore.value?.site_name || storeSlug}` }],
});
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