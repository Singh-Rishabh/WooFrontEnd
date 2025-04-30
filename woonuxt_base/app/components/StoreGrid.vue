<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-center mb-8">Our Stores</h1>
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">Loading stores...</p>
    </div>
    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-600">{{ error }}</p>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="store in stores" :key="store.site_id" class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div class="p-6">
          <h2 class="text-xl font-semibold mb-2">{{ store.site_name }}</h2>
          <p class="text-gray-600 mb-4 truncate">{{ store.site_url }}</p>
          <NuxtLink 
            :to="`/store/${getStoreSlug(store.site_name)}`"
            class="inline-block bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors duration-300"
            @click="selectStore(store)"
          >
            Visit Store
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useStoreManager } from '../composables/useStoreManager'

const { stores, loading, error, fetchStores, setCurrentStore } = useStoreManager()

const getStoreSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const selectStore = async (store: any) => {
  console.log('Selecting store:', store.site_name)
  try {
    await setCurrentStore(store)
    console.log('Store set successfully:', store.site_name)
  } catch (error) {
    console.error('Error setting store:', error)
  }
}

onMounted(() => {
  fetchStores()
})
</script>

<style scoped>
.bg-primary {
  background-color: #ff5733;
}

.bg-primary-dark {
  background-color: #e64a2e;
}
</style> 