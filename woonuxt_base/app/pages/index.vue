<script lang="ts" setup>
import { useStoreService } from '../services/storeService';

const { siteName, description, shortDescription, siteImage } = useAppConfig();
const { availableStores, isLoading, error, fetchStores } = useStoreService();

// Flag to prevent multiple fetches that could cause infinite loops
const hasFetched = ref(false);

// Fetch the stores only once when the component is mounted
onMounted(async () => {
  if (hasFetched.value) return;
  
  console.log('Home page mounted, fetching stores');
  hasFetched.value = true;
  
  try {
    await fetchStores();
    console.log('Stores loaded successfully:', availableStores.value.length);
  } catch (err) {
    console.error('Error loading stores:', err);
  }
});

useSeoMeta({
  title: `Store Selection - ${siteName}`,
  ogTitle: siteName,
  description: description,
  ogDescription: shortDescription,
  ogImage: siteImage,
  twitterCard: `summary_large_image`,
});
</script>

<template>
  <main>
    <div class="container my-12">
      <h1 class="text-2xl md:text-4xl font-bold text-center mb-8">Welcome to CatalogHub</h1>
      <p class="text-center text-gray-600 max-w-2xl mx-auto mb-12">Select a store to start shopping. Each store offers unique products and services.</p>
      
      <StoreList />

      <div v-if="availableStores.length > 0" class="mt-8 text-center text-sm">
        <p>{{ availableStores.length }} stores available</p>
      </div>

      <div v-if="error" class="mt-8 text-center text-red-600">
        <p>{{ error }}</p>
        <button 
          @click="fetchStores" 
          class="mt-2 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.brand img {
  max-height: min(8vw, 120px);
  object-fit: contain;
  object-position: center;
}
</style>
