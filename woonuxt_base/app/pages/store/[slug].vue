<script lang="ts" setup>
import { ProductsOrderByEnum } from '#woo';
import { useStoreService } from '../../services/storeService';

const route = useRoute();
const router = useRouter();
const storeSlug = route.params.slug as string;
const { availableStores, selectStore, fetchStores } = useStoreService();

// Fetch and set the current store
const fetchAndSetStore = async () => {
  // Make sure we have stores loaded
  if (availableStores.value.length === 0) {
    await fetchStores();
  }
  
  // Find the store by slug
  const store = availableStores.value.find(s => s.slug === storeSlug);
  
  if (!store) {
    // Store not found, redirect to store list
    console.error(`Store with slug "${storeSlug}" not found`);
    console.log('Available stores:', availableStores.value);
    router.push('/');
    return;
  }
  
  // Select this store (this will update the GraphQL endpoint)
  selectStore(store);
  
  // Continue with the normal page loading
  fetchPageData();
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
    // Fetch categories
    const { data } = await useAsyncGql('getProductCategories', { first: 6 });
    productCategories.value = data.value?.productCategories?.nodes || [];
    
    // Fetch popular products
    const { data: productData } = await useAsyncGql('getProducts', { first: 5, orderby: ProductsOrderByEnum.POPULARITY });
    popularProducts.value = productData.value.products?.nodes || [];
    
    loading.value = false;
  } catch (err: any) {
    error.value = err.message;
    loading.value = false;
    console.error('Error fetching store data:', err);
  }
};

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
        <button 
          @click="fetchAndSetStore" 
          class="mt-2 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    </div>
    
    <template v-else>
      <HeroBanner />

      <section class="container my-16">
        <div class="flex items-end justify-between">
          <h2 class="text-lg font-semibold md:text-2xl">{{ $t('messages.shop.shopByCategory') }}</h2>
          <NuxtLink class="text-primary" to="/categories">{{ $t('messages.general.viewAll') }}</NuxtLink>
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
          <NuxtLink class="text-primary" to="/products">{{ $t('messages.general.viewAll') }}</NuxtLink>
        </div>
        <ProductRow :products="popularProducts" class="grid-cols-2 md:grid-cols-4 lg:grid-cols-5 mt-8" />
      </section>
    </template>
  </main>
</template> 