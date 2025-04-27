import { ref, reactive } from 'vue';

export interface Store {
  id: number;
  name: string;
  slug: string;
  description: string;
  url: string;
  graphqlEndpoint: string;
  thumbnail?: string;
}

// State to track the currently selected store
const selectedStore = ref<Store | null>(null);
const availableStores = ref<Store[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
// Flag to prevent multiple simultaneous fetches
const isFetching = ref(false);

// Initialize the GraphQL client with the selected store's endpoint
export const useStoreService = () => {
  const fetchStores = async () => {
    // If already fetching or we already have stores, don't fetch again
    if (isFetching.value) {
      console.log('Already fetching stores, skipping duplicate fetch');
      return;
    }
    
    isFetching.value = true;
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await fetch('https://site.cataloghub.in/wp-json/custom/v1/view-all-sites');
      if (!response.ok) throw new Error('Failed to fetch stores');
      
      const data = await response.json();
      console.log('Fetched sites data:', data);
      
      // Map the API response to our Store interface
      availableStores.value = data.map((store: any) => {
        // Extract subdomain from the URL
        const url = new URL(store.site_url);
        const hostname = url.hostname;
        const subdomain = hostname.split('.')[0]; // Get the first part of the hostname
        
        return {
          id: store.site_id,
          name: store.site_name,
          slug: subdomain,
          description: '', // API doesn't provide description
          url: store.site_url,
          graphqlEndpoint: `${store.site_url}/graphql`,
          thumbnail: null // API doesn't provide thumbnail
        };
      });
      
      console.log('Mapped stores:', availableStores.value);
    } catch (err: any) {
      error.value = err.message;
      console.error('Error fetching stores:', err);
    } finally {
      isLoading.value = false;
      isFetching.value = false;
    }
  };

  const selectStore = (store: Store) => {
    selectedStore.value = store;
    
    if (process.client) {
      localStorage.setItem('selectedStore', JSON.stringify(store));
    }
    
    // Update the GraphQL endpoint
    const nuxtApp = useNuxtApp();
    // Type assertion to avoid TypeScript error
    const graphqlClient = nuxtApp.$graphql as any;
    if (graphqlClient && graphqlClient.clients && graphqlClient.clients.default) {
      graphqlClient.clients.default.host = store.graphqlEndpoint;
    } else {
      console.error('GraphQL client not available');
    }
    
    return store;
  };

  const initializeStore = async () => {
    // Try to get previously selected store from localStorage
    if (process.client) {
      const storedStore = localStorage.getItem('selectedStore');
      
      if (storedStore) {
        selectStore(JSON.parse(storedStore));
      }
    }
    
    // Always fetch the latest stores
    await fetchStores();
  };

  const getSelectedStore = () => selectedStore.value;
  const getAvailableStores = () => availableStores.value;
  const getIsLoading = () => isLoading.value;
  const getError = () => error.value;

  return {
    fetchStores,
    selectStore,
    initializeStore,
    getSelectedStore,
    getAvailableStores,
    getIsLoading,
    getError,
    selectedStore,
    availableStores,
    isLoading,
    error
  };
}; 