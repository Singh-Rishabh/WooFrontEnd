import { useStoreService } from '../services/storeService';

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server-side to prevent hydration issues
  if (process.server) return;
  
  const { selectedStore } = useStoreService();
  
  // Exclude certain routes from the check (like the homepage)
  const excludedRoutes = ['/', '/index', '/store-[slug]'];
  
  // Check if the current route is excluded
  const isExcluded = excludedRoutes.some(route => {
    if (route.includes('[slug]')) {
      return to.path.startsWith('/store/');
    }
    return to.path === route;
  });
  
  // If not excluded and no store is selected, redirect to home
  if (!isExcluded && !selectedStore.value) {
    console.warn('No store selected, redirecting to home');
    return navigateTo('/');
  }
}); 