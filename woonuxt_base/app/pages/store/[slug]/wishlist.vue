<script setup lang="ts">
import { useStoreManager, getStoreSlugFromUrl } from '../../../composables/useStoreManager'

const route = useRoute();

// Define page meta
definePageMeta({
  name: 'store-slug-wishlist'
})

const storeSlug = route.params.slug as string;

// Store management
const { currentStore, setCurrentStore, stores, fetchStores } = useStoreManager();

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

useHead({
  title: `Wishlist - ${currentStore.value?.site_name || storeSlug}`,
  meta: [{ name: 'description', content: `Your wishlist from ${currentStore.value?.site_name || storeSlug}` }],
});
</script>

<template>
  <WishlistView />
</template> 