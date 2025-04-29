import { useStoreService } from '../services/storeService';

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.server && to.path.startsWith('/store/')) {
    const storeService = useStoreService();
    // Always fetch stores on SSR for store routes
    await storeService.fetchStores();
    const slug = to.params.slug as string;
    const store = storeService.getAvailableStores().find(s => s.slug === slug);
    if (store) {
      // Set cookie for SSR (Nuxt 3 composable)
      useCookie('selectedStore').value = JSON.stringify(store);
    }
  }
}); 