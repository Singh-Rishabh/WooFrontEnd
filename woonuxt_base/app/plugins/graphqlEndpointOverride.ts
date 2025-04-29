/**
 * GraphQL Endpoint Override Plugin
 * 
 * This plugin intercepts GraphQL requests and overrides the endpoint based on
 * the currently selected store or localStorage value.
 */

import { useCookie, useRequestHeaders } from '#app';
import { useStoreService } from '../services/storeService';

export default defineNuxtPlugin({
  name: 'graphql-endpoint-override',
  enforce: 'pre', // Run before other plugins
  setup(nuxtApp) {
    // Helper to get endpoint from client or server
    const getGraphQLEndpoint = () => {
      // --- CLIENT SIDE ---
      if (process.client) {
        // 1. Try localStorage
        const endpoint = localStorage.getItem('graphql_endpoint');
        if (endpoint) {
          console.log('Using GraphQL endpoint from localStorage:', endpoint);
          return endpoint;
        }
        // 2. Try selectedStore in localStorage
        const storedStore = localStorage.getItem('selectedStore');
        if (storedStore) {
          try {
            const store = JSON.parse(storedStore);
            if (store && store.graphqlEndpoint) {
              console.log('Using GraphQL endpoint from selected store:', store.graphqlEndpoint);
              return store.graphqlEndpoint;
            }
          } catch (e) {
            console.error('Error parsing stored store:', e);
          }
        }
      }
      // --- SERVER SIDE (SSR) ---
      if (process.server) {
        try {
          // 1. Try to get store slug from cookies
          const headers = useRequestHeaders(['cookie']);
          const cookieHeader = String(headers['cookie'] || '');
          if (cookieHeader) {
            const match = cookieHeader.match(/selectedStore=([^;]+)/);
            if (match) {
              const storeCookie = decodeURIComponent(match[1] ?? '');
              try {
                const store = JSON.parse(storeCookie);
                if (store && store.graphqlEndpoint) {
                  console.log('SSR: Using GraphQL endpoint from selectedStore cookie:', store.graphqlEndpoint);
                  return store.graphqlEndpoint;
                }
              } catch (e) {
                // Not JSON, ignore
              }
            }
          }
          // 2. Try to extract store slug from route and look up store
          if (nuxtApp.ssrContext && nuxtApp.ssrContext.event) {
            const url = nuxtApp.ssrContext.event.node.req.url;
            // Match /store/:slug or /store/:slug/...
            const match = url && url.match(/\/store\/([^/?#]+)/);
            if (match) {
              const storeSlug = match[1];
              try {
                const { getAvailableStores } = useStoreService();
                const stores = getAvailableStores();
                const store = stores.find((s: any) => s.slug === storeSlug);
                if (store && store.graphqlEndpoint) {
                  console.log('SSR: Using GraphQL endpoint from route param:', store.graphqlEndpoint);
                  return store.graphqlEndpoint;
                }
                // If this is a /store/:slug route and no store found, throw error
                console.warn('SSR: No store endpoint found for /store/:slug, throwing error.');
                throw new Error('No store selected. Please select a store.');
              } catch (e) {
                console.error('SSR: Error looking up store from slug:', e);
                throw e;
              }
            }
          }
          // 3. For non-store routes, just fall back to dummy endpoint
          console.warn('SSR: No store endpoint found, falling back to dummy endpoint https://123.com');
          return 'https://123.com';
        } catch (e) {
          console.error('SSR: Error in endpoint selection:', e);
          throw e;
        }
      }
      // 4. Fallback to dummy endpoint (should not happen)
      console.warn('No store endpoint found, falling back to dummy endpoint https://123.com');
      return 'https://123.com';
    };
    // Provide the GraphQL client with the selected or fallback endpoint
    if (nuxtApp && 'vueApp' in nuxtApp) {
      const vueApp = nuxtApp.vueApp;
      console.log('Patching provide/inject system', getGraphQLEndpoint());
      vueApp.provide('graphql', {
        clients: {
          default: {
            host: getGraphQLEndpoint(),
          },
        },
      });
      // Set up event listener for endpoint changes
      if (process.client) {
        window.addEventListener('graphql-endpoint-set', (event: Event) => {
          const customEvent = event as CustomEvent;
          if (customEvent.detail && customEvent.detail.endpoint) {
            console.log('GraphQL endpoint changed:', customEvent.detail.endpoint);
            // Force a page reload to apply the new endpoint
            window.location.reload();
          }
        });
      }
    }
  },
}); 