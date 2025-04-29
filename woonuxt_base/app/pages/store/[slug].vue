<script lang="ts" setup>
import { ProductsOrderByEnum } from '#woo';
import { useStoreService } from '../../services/storeService';

const route = useRoute();
const router = useRouter();
const storeSlug = route.params.slug as string;
const { 
  availableStores, 
  selectStore, 
  fetchStores, 
  forceReloadGraphQLClient, 
  resetGraphQLState,
  logCurrentEndpoint 
} = useStoreService();

// Debug helper to track the current GraphQL endpoint
const currentEndpoint = ref('');
const updateCurrentEndpoint = () => {
  if (process.client) {
    currentEndpoint.value = logCurrentEndpoint() || '';
  }
};

// Reset GraphQL state function
const resetGraphQL = async () => {
  console.log('Resetting GraphQL state');
  await resetGraphQLState();
};

// Fetch and set the current store
const fetchAndSetStore = async () => {
  console.log(`Loading store with slug: ${storeSlug}`);
  
  // Make sure we have stores loaded
  if (availableStores.value.length === 0) {
    console.log('No stores loaded yet, fetching stores first');
    await fetchStores();
  }
  
  // Find the store by slug
  console.log('availableStores.value', availableStores.value);
  const store = availableStores.value.find(s => s.slug === storeSlug);
  
  if (!store) {
    // Store not found, redirect to store list
    console.error(`Store with slug "${storeSlug}" not found`);
    console.log('Available stores:', availableStores.value);
    router.push('/');
    return;
  }
  
  // Select this store (this will update the GraphQL endpoint)
  console.log(`Found store: ${store.name}, selecting it`);
  await selectStore(store);
  
  // Add direct URL parameters for any navigation
  router.beforeEach((to, from, next) => {
    // If navigating to a page that doesn't have the store in the URL
    if (!to.path.includes('/store/') && !to.query.store) {
      // Add the store parameter
      next({
        path: to.path,
        query: { ...to.query, store: storeSlug }
      });
    } else {
      next();
    }
  });
  
  // Log current endpoint for debugging
  updateCurrentEndpoint();
  
  // Continue with the normal page loading
  await fetchPageData();
};

// Fetch page data after the store is selected
const loading = ref(true);
const error = ref<string | null>(null);
const productCategories = ref([]);
const popularProducts = ref([]);

const fetchPageData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    console.log('Fetching store data...');
    
    // Before fetching, check the current GraphQL endpoint
    updateCurrentEndpoint();
    console.log(`Current GraphQL endpoint before fetching: ${currentEndpoint.value}`);
    
    // If the current endpoint doesn't match the expected one, force reload
    if (process.client && currentEndpoint.value && !currentEndpoint.value.includes(storeSlug)) {
      console.warn(`GraphQL endpoint mismatch! Expected: ${storeSlug}, actual: ${currentEndpoint.value}`);
      forceReloadGraphQLClient();
      // Wait a bit before continuing
      await new Promise(resolve => setTimeout(resolve, 200));
      updateCurrentEndpoint();
    }
    
    // Fetch categories
    const { data } = await useAsyncGql('getProductCategories', { first: 6 });
    productCategories.value = data.value?.productCategories?.nodes || [];
    console.log(`productCategories.value -----------------------: ${productCategories.value}`);
    console.log(`Loaded ${productCategories.value.length} categories`);
    
    // Fetch popular products
    const { data: productData } = await useAsyncGql('getProducts', { first: 5, orderby: ProductsOrderByEnum.POPULARITY });
    popularProducts.value = productData.value.products?.nodes || [];
    console.log(`Loaded ${popularProducts.value.length} products`);
    
    loading.value = false;
  } catch (err: any) {
    error.value = err.message;
    loading.value = false;
    console.error('Error fetching store data:', err);
    
    // If there's an error, check if it's related to the GraphQL endpoint
    if (err.message && (
      err.message.includes('Network Error') || 
      err.message.includes('Failed to fetch') ||
      err.message.includes('iss do not match')
    )) {
      console.warn('Error might be due to GraphQL endpoint mismatch, forcing reload');
      forceReloadGraphQLClient();
    }
  }
};

// Watch for route changes to handle store switching
watch(() => route.params.slug, async (newSlug, oldSlug) => {
  if (newSlug !== oldSlug) {
    console.log(`Route changed from ${oldSlug} to ${newSlug}, reloading store`);
    await fetchAndSetStore();
  }
}, { immediate: false });

// On page load
onMounted(() => {
  fetchAndSetStore();
});

// SEO
const { siteName, description, siteImage } = useAppConfig();
const title = storeSlug.charAt(0).toUpperCase() + storeSlug.slice(1).replace(/-/g, ' ');

useSeoMeta({
  title: `${title} Store`,
  ogTitle: `${title} - ${siteName}`,
  description: description,
  ogImage: siteImage,
  twitterCard: `summary_large_image`,
});

definePageMeta({
  layout: 'store',
});

// Create a ref for development mode check
const isDev = ref(process.dev || import.meta.env?.DEV || false);
</script>

<template>
  <main>
    <div v-if="loading" class="container py-12 flex justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    
    <div v-else-if="error" class="container my-12">
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong class="font-bold">Error loading store:</strong>
        <span class="block sm:inline">{{ error }}</span>
        <div class="mt-2 flex space-x-4">
          <button 
            @click="fetchAndSetStore" 
            class="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors duration-200"
          >
            Retry
          </button>
          <button 
            @click="forceReloadGraphQLClient" 
            class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            Refresh API Connection
          </button>
          <button 
            @click="resetGraphQL" 
            class="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors duration-200"
          >
            Reset GraphQL
          </button>
        </div>
      </div>
    </div>
    
    <template v-else>
      <HeroBanner />

      <!-- Debug info section -->
      <div v-if="isDev" class="container my-4 p-3 bg-gray-100 rounded text-sm">
        <div class="font-semibold text-gray-700">Debug Info</div>
        <div class="mt-1 space-y-1">
          <div>Store: {{ storeSlug }}</div>
          <div>
            GraphQL Endpoint: 
            <span class="font-mono">{{ currentEndpoint || 'Not set' }}</span>
            <button @click="updateCurrentEndpoint" class="ml-2 text-xs opacity-50 hover:opacity-100">↻</button>
          </div>
          <div class="flex space-x-2 mt-2">
            <button 
              @click="forceReloadGraphQLClient" 
              class="px-2 py-1 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors duration-200"
            >
              Refresh API
            </button>
            <button 
              @click="resetGraphQL" 
              class="px-2 py-1 bg-purple-500 text-white rounded-md text-xs font-medium hover:bg-purple-600 transition-colors duration-200"
            >
              Reset GraphQL
            </button>
          </div>
        </div>
      </div>

      <section class="container my-16">
        <div class="flex items-end justify-between">
          <h2 class="text-lg font-semibold md:text-2xl">{{ $t('messages.shop.shopByCategory') }}</h2>
          <NuxtLink class="text-primary" :to="`/categories?store=${storeSlug}`">{{ $t('messages.general.viewAll') }}</NuxtLink>
        </div>
        <div class="grid justify-center grid-cols-2 gap-4 mt-8 md:grid-cols-3 lg:grid-cols-6">
          <CategoryCard v-for="(category, i) in productCategories" :key="i" class="w-full" :node="category" />
        </div>
      </section>

      <section class="container grid gap-4 my-24 md:grid-cols-2 lg:grid-cols-4">
        <div class="flex items-center gap-8 p-8 bg-white rounded-lg">
          <img src="/icons/box.svg" width="60" height="60" alt="Free Shipping" loading="lazy" />
          <div>
            <h3 class="text-xl font-semibold">Free Shipping</h3>
            <p class="text-sm">Free shipping on order over €50</p>
          </div>
        </div>
        <div class="flex items-center gap-8 p-8 bg-white rounded-lg">
          <img src="/icons/moneyback.svg" width="60" height="60" alt="Money Back" loading="lazy" />
          <div>
            <h3 class="text-xl font-semibold">Peace of Mind</h3>
            <p class="text-sm">30 days money back guarantee</p>
          </div>
        </div>
        <div class="flex items-center gap-8 p-8 bg-white rounded-lg">
          <img src="/icons/secure.svg" width="60" height="60" alt="Secure Payment" loading="lazy" />
          <div>
            <h3 class="text-xl font-semibold">100% Payment Secure</h3>
            <p class="text-sm">Your payment are safe with us.</p>
          </div>
        </div>
        <div class="flex items-center gap-8 p-8 bg-white rounded-lg">
          <img src="/icons/support.svg" width="60" height="60" alt="Support 24/7" loading="lazy" />
          <div>
            <h3 class="text-xl font-semibold">Support 24/7</h3>
            <p class="text-sm">24/7 Online support</p>
          </div>
        </div>
      </section>

      <section class="container my-16" v-if="popularProducts.length > 0">
        <div class="flex items-end justify-between">
          <h2 class="text-lg font-semibold md:text-2xl">{{ $t('messages.shop.popularProducts') }}</h2>
          <NuxtLink class="text-primary" :to="`/products?store=${storeSlug}`">{{ $t('messages.general.viewAll') }}</NuxtLink>
        </div>
        <ProductRow :products="popularProducts" class="grid-cols-2 md:grid-cols-4 lg:grid-cols-5 mt-8" />
      </section>
    </template>
  </main>
</template> 