<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-center mb-8">Our Stores</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="store in stores" :key="store.site_id" class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div class="p-6">
          <h2 class="text-xl font-semibold mb-2">{{ store.site_name }}</h2>
          <p class="text-gray-600 mb-4 truncate">{{ store.site_url }}</p>
          <a 
            :href="store.site_url" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="inline-block bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors duration-300"
          >
            Visit Store
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Store {
  site_id: number
  site_url: string
  site_name: string
  admin_email: string
  language: string
}

const stores = ref<Store[]>([])

const fetchStores = async () => {
  try {
    const response = await fetch('https://site.cataloghub.in/wp-json/custom/v1/view-all-sites')
    const data = await response.json()
    stores.value = data
  } catch (error) {
    console.error('Error fetching stores:', error)
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