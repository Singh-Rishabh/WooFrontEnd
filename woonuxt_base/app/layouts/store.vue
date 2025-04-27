<script setup lang="ts">
import { useStoreService } from '../services/storeService';

const { selectedStore } = useStoreService();
</script>

<template>
  <div class="flex min-h-screen flex-col justify-between">
    <div v-if="selectedStore" class="bg-primary text-white py-2 px-4 text-sm font-medium text-center">
      <div class="container mx-auto flex justify-between items-center">
        <div>Currently browsing: <strong>{{ selectedStore.name }}</strong></div>
        <NuxtLink to="/" class="text-white hover:underline">Switch Store</NuxtLink>
      </div>
    </div>

    <!-- We'll use the existing Header component from the base theme -->
    <div class="flex-1">
      <slot />
    </div>

    <!-- We'll use the existing Footer component from the base theme -->
  </div>
</template> 