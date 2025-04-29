import { useStoreService } from '../services/storeService';

export default defineNuxtPlugin({
  name: 'store-init-from-query',
  enforce: 'pre', // Run before other plugins
  async setup() {
    // Get the route and store service
    const route = useRoute();
    const storeService = useStoreService();
    
    // Function to handle store query parameter
    const handleStoreQuery = async () => {
      // Check if there's a store parameter in the query
      const storeSlug = route.query.store as string;
      
      if (storeSlug) {
        console.log(`Found store parameter in query: ${storeSlug}, initializing store`);
        
        try {
          // Ensure we have stores loaded
          if (storeService.availableStores.value.length === 0) {
            await storeService.fetchStores();
          }
          
          // Find the store by slug
          const store = storeService.availableStores.value.find(s => s.slug === storeSlug);
          
          if (store) {
            // Select this store
            console.log(`Found store from query parameter: ${store.name}, selecting it`);
            await storeService.selectStore(store);
            
            // Force reload GraphQL client
            storeService.forceReloadGraphQLClient();
          } else {
            console.error(`Store with slug "${storeSlug}" not found in available stores`);
          }
        } catch (err) {
          console.error('Error initializing store from query parameter:', err);
        }
      }
    };
    
    // Run on client side only
    if (process.client) {
      // Process store parameter on initial load
      await handleStoreQuery();
      
      // Watch for query changes to handle store parameter changes
      watch(() => route.query.store, async (newStore, oldStore) => {
        if (newStore && newStore !== oldStore) {
          console.log(`Store query parameter changed to ${newStore}, updating store`);
          await handleStoreQuery();
        }
      });
    }
  }
}); 