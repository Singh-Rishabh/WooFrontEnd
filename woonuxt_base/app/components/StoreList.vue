<script setup lang="ts">
import { useStoreService } from '../services/storeService';
import StoreCard from './StoreCard.vue';

const { availableStores, isLoading, error, fetchStores } = useStoreService();

// No need to fetch stores here - the parent component (index.vue) handles this
// This prevents duplicate fetching and potential infinite loops
</script>

<template>
  <div class="store-list">
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-6">
      <strong class="font-bold">Error:</strong>
      <span class="block sm:inline">{{ error }}</span>
      <button 
        @click="fetchStores" 
        class="mt-2 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors duration-200"
      >
        Retry
      </button>
    </div>
    
    <div v-else-if="availableStores.length === 0" class="text-center py-12">
      <p class="text-gray-600">No stores found. Please check the console for any errors.</p>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <StoreCard 
        v-for="store in availableStores" 
        :key="store.id" 
        :store="store"
      />
    </div>

    <div class="mt-4 text-center text-xs text-gray-500">
      Debug info: {{ availableStores.length }} stores loaded
    </div>
  </div>
</template> 