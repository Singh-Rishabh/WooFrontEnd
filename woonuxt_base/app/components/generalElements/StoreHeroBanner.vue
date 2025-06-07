<template>
  <div class="relative mx-auto bg-gradient-to-br from-blue-50 to-indigo-100 py-16 lg:py-24">
    <div class="container mx-auto px-4">
      <div class="text-center max-w-4xl mx-auto">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
          {{ storeName }}
        </h1>
        <h2 class="text-xl md:text-2xl lg:text-3xl font-medium text-gray-700 mb-6">
          Discover Amazing Products
        </h2>
        <div class="max-w-2xl mx-auto mb-8 text-md text-gray-500">
          <p>Welcome to our store! Browse through our carefully curated collection of quality products and find exactly what you're looking for.</p>
        </div>
        <NuxtLink 
          :to="shopNowUrl"
          class="inline-flex items-center px-8 py-4 text-md text-white bg-gray-800 rounded-xl hover:bg-gray-950 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
          </svg>
          Shop Now
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  storeName: string
  storeSlug: string
}

const props = defineProps<Props>()

// Generate the shop now URL for the store's products page
const shopNowUrl = computed(() => `/store/${props.storeSlug}/products`)
</script> 