import { useStoreService } from '../services/storeService';

export default defineNuxtPlugin({
  name: 'store-init',
  enforce: 'pre', // Run before other plugins
  async setup() {
    // Only run on client side to prevent hydration issues
    if (process.client) {
      const storeService = useStoreService();
      
      // Initialize store on app start
      try {
        await storeService.initializeStore();
      } catch (err) {
        console.error('Failed to initialize store service:', err);
      }
    }
  }
}); 