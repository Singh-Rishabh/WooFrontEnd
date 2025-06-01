<script setup lang="ts">
const { setProducts, updateProductList } = useProducts();
const { isQueryEmpty } = useHelpers();
const { storeSettings } = useAppConfig();
const route = useRoute();
const categorySlug = route.params.categorySlug as string; // Category slug from route
const storeSlug = route.params.slug as string; // Store slug from parent route

// Store management
const { currentStore, setCurrentStore, stores, fetchStores, getStoreSlugFromUrl } = useStoreManager();

// Initialize store if needed
onMounted(async () => {
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
    }
  }
});

const { data } = await useAsyncGql('getProducts', { slug: categorySlug, first: 20, after: null });
const productsInCategory = (data.value?.products?.nodes || []) as Product[];
setProducts(productsInCategory);

onMounted(() => {
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
  <div class="container flex items-start gap-16" v-if="productsInCategory.length">
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
</template> 