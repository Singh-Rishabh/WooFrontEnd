<script setup lang="ts">
const route = useRoute();
const storeSlug = route.params.slug as string;

// Store management
const { currentStore, setCurrentStore, stores, fetchStores } = useStoreManager();

// Initialize store if needed
onMounted(async () => {
  if (!currentStore.value) {
    if (!stores.value.length) {
      await fetchStores();
    }
    
    const store = stores.value.find((s: any) => 
      s.site_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === storeSlug
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