<script lang="ts" setup>
const route = useRoute();
const storeSlug = route.params.slug as string;

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

const { data } = await useAsyncGql('getProductCategories');
const productCategories = data.value.productCategories?.nodes as ProductCategory[];

useHead({
  title: `Categories`,
  meta: [{ name: 'description', content: 'All product categories' }],
  link: [{ rel: 'canonical', href: `https://v3.woonuxt.com/store/${storeSlug}/categories` }],
});
</script>

<template>
  <main class="container">
    <div v-if="productCategories?.length" class="grid grid-cols-2 gap-4 my-6 md:grid-cols-3 lg:gap-8 xl:grid-cols-4">
      <CategoryCard v-for="(category, i) in productCategories" :key="i" :node="category" :image-loading="i <= 2 ? 'eager' : 'lazy'" />
    </div>
  </main>
</template> 