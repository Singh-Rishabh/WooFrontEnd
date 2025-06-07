<script setup lang="ts">
const { setProducts, updateProductList } = useProducts();
const { isQueryEmpty } = useHelpers();
const { storeSettings } = useAppConfig();
const route = useRoute();
const categorySlug = route.params.categorySlug as string; // Category slug from route
const storeSlug = route.params.slug as string; // Store slug from parent route

// Store management
const { currentStore, setCurrentStore, stores, fetchStores, getStoreSlugFromUrl } = useStoreManager();

// Products data state
const productsInCategory = ref<Product[]>([]);
const isLoading = ref(false);
const loadingError = ref<string | null>(null);

// Initialize store if needed and fetch category products
const initializeAndFetchProducts = async () => {
  if (!currentStore.value) {
    if (!stores.value.length) {
      await fetchStores();
    }
    
    // Find store by URL-based slug instead of name-based slug
    const store = stores.value.find((s: any) => 
      getStoreSlugFromUrl(s.site_url) === storeSlug
    );
    
    if (store) {
      await setCurrentStore(store);
    } else {
      loadingError.value = 'Store not found';
      return;
    }
  }

  // Fetch category products using the store-specific GraphQL endpoint
  await fetchCategoryProducts();
};

const fetchCategoryProducts = async () => {
  if (!currentStore.value) {
    console.error('No current store set');
    loadingError.value = 'Store not initialized';
    return;
  }

  if (isLoading.value) {
    console.log('Already loading category products, skipping...');
    return;
  }

  isLoading.value = true;
  
  try {
    console.log('Fetching category products for store:', currentStore.value.site_name);
    
    // Get the GraphQL client that should be configured for the current store
    const { $gql } = useNuxtApp();
    
    if (!$gql || !($gql as any)?.default) {
      console.error('GraphQL client not available');
      loadingError.value = 'GraphQL client not available';
      return;
    }

    const gqlClient = ($gql as any).default;

    // Use the existing getProducts query directly
    const query = `
      query getProducts($slug: [String], $first: Int, $after: String) {
        products(where: { categoryIn: $slug }, first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            name
            slug
            databaseId
            type
            onSale
            image {
              id
              sourceUrl
              cartSourceUrl: sourceUrl(size: THUMBNAIL)
              producCardSourceUrl: sourceUrl(size: WOOCOMMERCE_THUMBNAIL)
              altText
              title
            }
            productCategories {
              nodes {
                databaseId
                slug
                name
                count
              }
            }
            ... on SimpleProduct {
              name
              slug
              price
              rawPrice: price(format: RAW)
              date
              regularPrice
              rawRegularPrice: regularPrice(format: RAW)
              salePrice
              rawSalePrice: salePrice(format: RAW)
              stockStatus
              stockQuantity
              lowStockAmount
              averageRating
              weight
              length
              width
              height
              reviewCount
              onSale
              virtual
            }
            ... on VariableProduct {
              name
              slug
              price
              rawPrice: price(format: RAW)
              date
              weight
              length
              width
              height
              averageRating
              reviewCount
              onSale
              regularPrice
              rawRegularPrice: regularPrice(format: RAW)
              salePrice
              rawSalePrice: salePrice(format: RAW)
              stockStatus
              totalSales
              stockQuantity
              lowStockAmount
              variations(first: 100) {
                nodes {
                  name
                  databaseId
                  price
                  regularPrice
                  salePrice
                  rawSalePrice: salePrice(format: RAW)
                  slug
                  stockQuantity
                  stockStatus
                  hasAttributes
                  image {
                    id
                    sourceUrl
                    cartSourceUrl: sourceUrl(size: THUMBNAIL)
                    producCardSourceUrl: sourceUrl(size: WOOCOMMERCE_THUMBNAIL)
                    altText
                    title
                  }
                  attributes {
                    nodes {
                      name
                      attributeId
                      value
                      label
                    }
                  }
                }
              }
            }
            ... on ExternalProduct {
              externalUrl
              buttonText
            }
          }
        }
      }
    `;

    console.log('Executing category products query with categorySlug:', categorySlug);
    console.log('Using GraphQL endpoint:', gqlClient.host);
    
    const result = await gqlClient.query(query, { slug: [categorySlug], first: 20, after: null });
    
    if (result?.data?.products?.nodes) {
      productsInCategory.value = result.data.products.nodes as Product[];
      setProducts(productsInCategory.value);
      console.log('Category products fetched successfully:', productsInCategory.value.length, 'products from endpoint:', gqlClient.host);
    } else {
      console.warn('No products found in response');
      productsInCategory.value = [];
      setProducts([]);
    }
  } catch (error) {
    console.error('Error fetching category products:', error);
    loadingError.value = 'Failed to load category products';
    productsInCategory.value = [];
    setProducts([]);
  } finally {
    isLoading.value = false;
  }
};

// Watch for store changes and refetch products
watch(currentStore, async (newStore, oldStore) => {
  if (newStore && newStore !== oldStore) {
    console.log('Store changed, refetching category products...');
    await fetchCategoryProducts();
  }
}, { immediate: false });

// Initialize when component mounts
onMounted(async () => {
  console.log('Category page mounted, current store:', currentStore.value?.site_name);
  await initializeAndFetchProducts();
  
  if (!isQueryEmpty.value) updateProductList();
});

watch(
  () => route.query,
  () => {
    if (route.name !== 'store-slug-product-category-categorySlug') return;
    updateProductList();
  },
);

useHead({
  title: 'Products',
  meta: [{ name: 'description', content: 'Products' }],
});
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="container flex items-center justify-center min-h-[400px]">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p class="text-gray-600">Loading category products...</p>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="loadingError" class="container flex items-center justify-center min-h-[400px]">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-red-600 mb-4">Error</h1>
      <p class="text-gray-600 mb-4">{{ loadingError }}</p>
      <button 
        @click="initializeAndFetchProducts" 
        class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>

  <!-- Products Content -->
  <div v-else-if="productsInCategory.length" class="container flex items-start gap-16">
    <Filters v-if="storeSettings.showFilters" :hide-categories="true" />

    <div class="w-full">
      <div class="flex items-center justify-between w-full gap-4 mt-8 md:gap-8">
        <ProductResultCount />
        <OrderByDropdown class="hidden md:inline-flex" v-if="storeSettings.showOrderByDropdown" />
        <ShowFilterTrigger v-if="storeSettings.showFilters" class="md:hidden" />
      </div>
      <ProductGrid />
    </div>
  </div>

  <!-- No Products Found -->
  <div v-else class="container flex items-center justify-center min-h-[400px]">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-gray-600 mb-4">No Products Found</h1>
      <p class="text-gray-500">No products were found in this category for this store.</p>
    </div>
  </div>
</template> 