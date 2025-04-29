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
        const success = await storeService.initializeStore();
        if (!success) {
          console.warn('Store service initialization returned false. Check the error state.');
        }
      } catch (err) {
        console.error('Failed to initialize store service:', err);
        // Log error but don't crash the app
      }
    }
    
    return {
      provide: {
        storeInitialized: true,
      },
    };
  }
}); 