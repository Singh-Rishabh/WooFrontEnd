import { useStoreService } from '../services/storeService';

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server-side to prevent hydration issues
  if (process.server) return;
  
  const { selectedStore } = useStoreService();
  
  // Exclude certain routes from the check (like the homepage)
  const excludedRoutes = ['/', '/index'];
  
  // Check if the current route is excluded or is a store selection route
  if (excludedRoutes.includes(to.path) || to.path.startsWith('/store/')) {
    return;
  }
  
  // If no store is selected, redirect to home
  if (!selectedStore.value) {
    console.warn('No store selected, redirecting to home');
    return navigateTo('/');
  }
}); 