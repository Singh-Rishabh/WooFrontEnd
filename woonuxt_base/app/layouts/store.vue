<script setup lang="ts">
import { useStoreService } from '../services/storeService';

const { selectedStore, forceReloadGraphQLClient, logCurrentEndpoint } = useStoreService();

// Track the current GraphQL endpoint for debugging
const currentEndpoint = ref('');
const updateEndpointInfo = () => {
  if (process.client) {
    currentEndpoint.value = logCurrentEndpoint() || '';
  }
};

// Print debug info
onMounted(() => {
  console.log('Store layout mounted, selected store:', selectedStore.value?.name);
  updateEndpointInfo();
  
  // Don't use setInterval as it can cause performance issues and potential loops
  // Just update the endpoint info once on mount
});

// Debug function to manually refresh GraphQL client
const refreshGraphQLClient = () => {
  console.log('Manually refreshing GraphQL client');
  forceReloadGraphQLClient();
  setTimeout(updateEndpointInfo, 500);
};

// Function to manually hard refresh the page
const hardRefreshPage = () => {
  if (process.client) {
    console.log('Hard refreshing page...');
    const url = new URL(window.location.href);
    url.searchParams.set('t', Date.now().toString());
    window.location.href = url.toString();
  }
};
</script>

<template>
  <div class="flex min-h-screen flex-col justify-between">
    <div v-if="selectedStore" class="bg-primary text-white py-2 px-4 text-sm font-medium">
      <div class="container mx-auto flex justify-between items-center">
        <div>
          Currently browsing: <strong>{{ selectedStore.name }}</strong>
          <span class="text-xs ml-2 opacity-70">({{ selectedStore.graphqlEndpoint }})</span>
        </div>
        <div class="flex gap-4">
          <button @click="refreshGraphQLClient" class="text-white text-xs hover:underline">Refresh API Connection</button>
          <button @click="hardRefreshPage" class="text-white text-xs hover:underline">Hard Refresh</button>
          <NuxtLink to="/" class="text-white hover:underline">Switch Store</NuxtLink>
        </div>
      </div>
      
      <!-- Debug info - only visible in dev mode -->
      <div v-if="process.env.NODE_ENV === 'development'" class="container mx-auto mt-1 text-xs">
        <div class="flex justify-between">
          <div>
            Expected endpoint: <span class="font-mono">{{ selectedStore.graphqlEndpoint }}</span>
          </div>
          <div>
            Active endpoint: <span class="font-mono" :class="{ 'text-red-300': selectedStore.graphqlEndpoint !== currentEndpoint && currentEndpoint }">{{ currentEndpoint || 'Not available' }}</span>
            <span v-if="selectedStore.graphqlEndpoint !== currentEndpoint && currentEndpoint" class="text-red-300 ml-2">(MISMATCH!)</span>
            <button @click="updateEndpointInfo" class="ml-2 text-xs opacity-50 hover:opacity-100">↻</button>
          </div>
        </div>
      </div>
    </div>

    <!-- We'll use the existing Header component from the base theme -->
    <div class="flex-1">
      <slot />
    </div>

    <!-- We'll use the existing Footer component from the base theme -->
  </div>
</template> 