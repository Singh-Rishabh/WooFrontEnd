<script setup lang="ts">
import type { Store } from '../services/storeService';

defineProps<{
  store: Store;
}>();
</script>

<template>
  <div class="store-card bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
    <div v-if="store.thumbnail" class="h-40 overflow-hidden">
      <img :src="store.thumbnail" :alt="store.name" class="w-full h-full object-cover" />
    </div>
    <div v-else class="h-40 bg-gray-100 flex items-center justify-center">
      <div class="text-4xl font-bold text-gray-300">{{ store.name.charAt(0) }}</div>
    </div>
    <div class="p-4">
      <h3 class="text-lg font-semibold mb-2">{{ store.name }}</h3>
      <p v-if="store.description" class="text-sm text-gray-600 mb-4 line-clamp-2">{{ store.description }}</p>
      <div class="flex justify-end">
        <NuxtLink 
          :to="`/store/${store.slug}`" 
          class="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark transition-colors duration-200"
        >
          Visit Store
        </NuxtLink>
      </div>
    </div>
  </div>
</template> 