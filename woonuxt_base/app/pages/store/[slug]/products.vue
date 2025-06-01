<script setup lang="ts">
const { setProducts, updateProductList } = useProducts();
const route = useRoute();
const router = useRouter();
const nuxtApp = useNuxtApp();
const { storeSettings } = useAppConfig();
const { isQueryEmpty } = useHelpers();
const storeSlug = route.params.slug as string;

console.log('📄 Products page loading for store:', storeSlug);

// Store management
const { currentStore, setCurrentStore, stores, fetchStores, getStoreSlugFromUrl } = useStoreManager();

// Component state
const allProducts = ref<Product[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Initialize store and fetch data
const initializeAndFetch = async () => {
  console.log('🔄 initializeAndFetch called');
  try {
    loading.value = true;
    error.value = null;

    // Initialize store if needed
    if (!currentStore.value) {
      console.log('🏪 No current store, fetching stores...');
      if (!stores.value.length) {
        await fetchStores();
      }
      
      // Find store by URL-based slug instead of name-based slug
      const store = stores.value.find((s: any) => 
        getStoreSlugFromUrl(s.site_url) === storeSlug
      );
      
      if (store) {
        console.log('✅ Found store:', store.site_name);
        await setCurrentStore(store);
      } else {
        console.error('❌ Store not found for slug:', storeSlug);
        throw new Error('Store not found');
      }
    }

    // Fetch products using GraphQL client directly
    console.log('📦 Fetching products...');
    const gql = nuxtApp.$gql as any;
    if (!gql?.default) {
      throw new Error('GraphQL client not available');
    }

    const productsQuery = `
      query GetProducts($first: Int!) {
        products(first: $first) {
          nodes {
            id
            databaseId
            name
            type
            slug
            description
            shortDescription
            image {
              id
              sourceUrl
              producCardSourceUrl: sourceUrl(size: WOOCOMMERCE_THUMBNAIL)
              altText
              title
            }
            ... on SimpleProduct {
              price
              regularPrice
              salePrice
            }
            ... on VariableProduct {
              price
              regularPrice
              salePrice
            }
          }
        }
      }
    `;

    const result = await gql.default.query(productsQuery, { first: 50 });
    console.log('📥 Products result:', result);
    
    if (result.data?.products?.nodes) {
      allProducts.value = result.data.products.nodes;
      setProducts(allProducts.value);
      console.log('✅ Products loaded:', allProducts.value.length);
      
      if (!isQueryEmpty.value) {
        updateProductList();
      }
    } else {
      console.warn('⚠️ No products data in response');
    }
  } catch (err) {
    console.error('❌ Error loading products:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load products';
  } finally {
    loading.value = false;
    console.log('🏁 Products loading completed');
  }
};

onMounted(() => {
  console.log('🔄 Products page mounted');
  initializeAndFetch();
});

watch(
  () => route.query,
  () => {
    if (route.name !== 'store-slug-products') return;
    updateProductList();
  },
);

// Define page meta to ensure proper route matching
definePageMeta({
  name: 'store-slug-products'
})

// Debug info for template
const routeDebug = computed(() => ({
  name: route.name,
  path: route.path,
  fullPath: route.fullPath,
  params: route.params,
  component: 'Products Page'
}))

const testFunction = () => {
  console.log('✅ Test button clicked on products page')
  alert('Products page is working!')
}

useHead({
  title: `Products - ${storeSlug}`,
  meta: [{ name: 'description', content: 'Discover our products' }],
});
</script>

<template>
  <div class="container">
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">Loading products...</p>
    </div>
    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-600">{{ error }}</p>
      <button 
        @click="initializeAndFetch" 
        class="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
      >
        Retry
      </button>
    </div>
    <div v-else-if="allProducts?.length" class="flex items-start gap-16">
      <Filters v-if="storeSettings.showFilters" />

      <div class="w-full">
        <div class="flex items-center justify-between w-full gap-4 mt-8 md:gap-8">
          <ProductResultCount />
          <OrderByDropdown class="hidden md:inline-flex" v-if="storeSettings.showOrderByDropdown" />
          <ShowFilterTrigger v-if="storeSettings.showFilters" class="md:hidden" />
        </div>
        <ProductGrid />
      </div>
    </div>
    <NoProductsFound v-else>Could not fetch products from your store. Please check your configuration.</NoProductsFound>
  </div>
</template>

<style scoped>
.bg-primary {
  background-color: #ff5733;
}

.bg-primary-dark {
  background-color: #e64a2e;
}
</style> 