<script setup lang="ts">
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
</script>

<template>
  <WishlistView />
</template> 