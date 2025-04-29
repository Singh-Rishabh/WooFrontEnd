import { ref, reactive } from 'vue';
import { useGql } from '#imports';

export interface Store {
  id: number;
  name: string;
  slug: string;
  description: string;
  url: string;
  graphqlEndpoint: string;
  thumbnail?: string;
}

interface GraphQLClients {
  [key: string]: any;
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
  // State
  const stores = useState<Store[]>('stores', () => []);
  const selectedStore = useState<Store | null>('selectedStore', () => null);
  const isFetchingStores = useState<boolean>('isFetchingStores', () => false);
  const graphqlClients = useState<GraphQLClients>('graphqlClients', () => ({}));
  
  // Keep track of our last successful fetch to prevent redundant calls
  const lastFetchTimestamp = useState<number>('storeLastFetch', () => 0);
  
  // Flag to prevent multiple simultaneous fetches
  const fetchPromise = ref<Promise<Store[]> | null>(null);
  
  /**
   * Fetch all stores - public wrapper for getStores
   */
  const fetchStores = async (force = false): Promise<Store[]> => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const result = await getStores(force);
      availableStores.value = result;
      return result;
    } catch (err: any) {
      console.error('Error in fetchStores:', err);
      error.value = err?.message || 'Failed to fetch stores';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Get all stores from the main site
   */
  const getStores = async (force = false): Promise<Store[]> => {
    // If we already have stores and it hasn't been 5 minutes since our last fetch, return the cached stores
    const fiveMinutes = 5 * 60 * 1000;
    const now = Date.now();
    
    if (!force && 
        stores.value?.length > 0 && 
        now - lastFetchTimestamp.value < fiveMinutes) {
      console.log('Using cached stores', stores.value);
      return stores.value;
    }
    
    // If we already have a fetch in progress, return that promise
    if (fetchPromise.value) {
      console.log('Fetch already in progress, reusing promise');
      return fetchPromise.value;
    }
    
    console.log('Fetching stores from API');
    isFetchingStores.value = true;
    
    // Create a new fetch promise
    fetchPromise.value = new Promise(async (resolve, reject) => {
      try {
        // Use the main site's GraphQL endpoint to fetch all stores
        const mainGraphQLEndpoint = import.meta.env.VITE_MAIN_GRAPHQL_ENDPOINT || 'https://cataloghub.in/graphql';
        
        // Fetch the stores
        try {
          // Create a temporary client for this request with more verbose debugging
          console.log('Creating GraphQL client for endpoint:', mainGraphQLEndpoint);
          
          let mainSiteClient;
          try {
            mainSiteClient = useGql();
            console.log('GraphQL client created successfully:', !!mainSiteClient);
          } catch (clientError) {
            console.error('Failed to initialize GraphQL client:', clientError);
            throw new Error('Failed to initialize GraphQL client');
          }
          
          if (!mainSiteClient) {
            throw new Error('GraphQL client is undefined');
          }
          
          // Try different ways to call the GraphQL client
          console.log('Attempting to call GraphQL client...');
          
          let data;
          
          try {
            // Method 1: Direct call with operation name
            const response = await mainSiteClient(mainGraphQLEndpoint, {
              query: `query GetAllStores {
                wooMultisiteStores {
                  nodes {
                    id
                    name
                    slug
                    url
                    graphqlEndpoint
                  }
                }
              }`
            });
            
            data = response.data;
          } catch (callError) {
            console.error('Error with method 1:', callError);
            
            try {
              // Method 2: Alternative call format
              const response = await mainSiteClient(mainGraphQLEndpoint, {
                operation: 'GetAllStores',
                query: `
                  wooMultisiteStores {
                    nodes {
                      id
                      name
                      slug
                      url
                      graphqlEndpoint
                    }
                  }
                `
              });
              
              data = response.data;
            } catch (callError2) {
              console.error('Error with method 2:', callError2);
              
              try {
                // Method 3: Direct fetch to view-all-sites endpoint if available
                console.log('Trying direct fetch to view-all-sites endpoint...');
                
                if (process.client) {
                  const response = await fetch('https://site.cataloghub.in/wp-json/custom/v1/view-all-sites', {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }
                  
                  const jsonData = await response.json();
                  console.log('Direct fetch response:', jsonData);
                  
                  if (jsonData && Array.isArray(jsonData)) {
                    data = {
                      wooMultisiteStores: {
                        nodes: jsonData.map((site: any, index: number) => ({
                          id: site.id || String(index + 1),
                          name: site.name,
                          slug: site.slug,
                          url: site.url,
                          graphqlEndpoint: site.graphqlEndpoint || `${site.url}/graphql`
                        }))
                      }
                    };
                  }
                }
              } catch (callError3) {
                console.error('Error with method 3:', callError3);
                
                // Mock data with actual stores as final fallback
                console.warn('Using fallback mock data with actual stores');
                data = {
                  wooMultisiteStores: {
                    nodes: [
                      {
                        id: '1',
                        name: 'Lakshmi',
                        slug: 'lakshmi',
                        url: 'https://lakshmi.cataloghub.in',
                        graphqlEndpoint: 'https://lakshmi.cataloghub.in/graphql'
                      },
                      {
                        id: '2',
                        name: 'ShivShakti',
                        slug: 'shivshakti',
                        url: 'https://shivshakti.cataloghub.in',
                        graphqlEndpoint: 'https://shivshakti.cataloghub.in/graphql'
                      }
                    ]
                  }
                };
              }
            }
          }
          
          // Update the stores state
          if (data?.wooMultisiteStores?.nodes) {
            stores.value = data.wooMultisiteStores.nodes;
            lastFetchTimestamp.value = now;
            resolve(stores.value);
          } else {
            console.error('No stores found in API response');
            reject(new Error('No stores found'));
          }
        } catch (error) {
          console.error('Error fetching stores:', error);
          reject(error);
        }
      } finally {
        isFetchingStores.value = false;
        fetchPromise.value = null;
      }
    });
    
    return fetchPromise.value;
  };

  /**
   * Get a GraphQL client for a specific store
   */
  const getGraphQLClient = (endpoint: string): any => {
    // Initialize if not already set
    if (!graphqlClients.value[endpoint]) {
      console.log('Creating new GraphQL client for endpoint:', endpoint);
      graphqlClients.value[endpoint] = useGql();
    }
    return graphqlClients.value[endpoint]!;
  };

  /**
   * Force reload a GraphQL client for a specific endpoint
   */
  const forceReloadGraphQLClient = () => {
    if (!selectedStore.value) {
      console.warn('No store selected, cannot reload GraphQL client');
      return null;
    }
    
    const endpoint = selectedStore.value.graphqlEndpoint;
    console.log('Force reloading GraphQL client for endpoint:', endpoint);
    
    // Replace the client for this endpoint
    graphqlClients.value[endpoint] = useGql();
    
    return graphqlClients.value[endpoint];
  };

  /**
   * Get the current GraphQL endpoint for debugging
   */
  const logCurrentEndpoint = (): string | null => {
    if (!selectedStore.value) return null;
    
    const endpoint = selectedStore.value.graphqlEndpoint;
    const client = graphqlClients.value[endpoint];
    
    console.log('Current endpoint:', endpoint);
    console.log('Client exists:', !!client);
    
    return endpoint;
  };

  /**
   * Select a store by slug
   */
  const selectStore = async (slug: string): Promise<Store | null> => {
    // If we don't have any stores, fetch them first
    if (!stores.value || stores.value.length === 0) {
      await getStores();
    }
    
    // Find the store by slug
    const store = stores.value.find((s) => s.slug === slug);
    
    if (!store) {
      console.error(`Store with slug "${slug}" not found`);
      return null;
    }
    
    // Check if this is a new store
    const isNewStore = !selectedStore.value || selectedStore.value.slug !== slug;
    
    // If this is a new store, update the selected store
    if (isNewStore) {
      console.log(`Selecting store: ${store.name} (${store.slug})`);
      console.log(`GraphQL endpoint: ${store.graphqlEndpoint}`);
      
      // Update the selected store
      selectedStore.value = store;
      
      // Ensure we have a client for this store
      getGraphQLClient(store.graphqlEndpoint);
    }
    
    return store;
  };

  /**
   * Get a store by slug
   */
  const getStoreBySlug = async (slug: string): Promise<Store | null> => {
    // If we don't have any stores, fetch them first
    if (!stores.value || stores.value.length === 0) {
      await getStores();
    }
    
    // Find the store by slug
    return stores.value.find((s) => s.slug === slug) || null;
  };

  const initializeStore = async () => {
    try {
      // Try to get previously selected store from localStorage
      if (process.client) {
        const storedStore = localStorage.getItem('selectedStore');
        
        if (storedStore) {
          try {
            const storeData = JSON.parse(storedStore);
            if (storeData && storeData.slug) {
              await selectStore(storeData.slug);
            }
          } catch (e) {
            console.error('Error parsing stored store:', e);
            // Don't rethrow here, just log the error and continue
          }
        }
      }
      
      // Always fetch the latest stores
      await getStores();
      return true;
    } catch (e) {
      console.error('Failed to initialize store service:', e);
      // Set error state but don't rethrow to prevent app from crashing
      error.value = e instanceof Error ? e.message : 'Failed to initialize store service';
      return false;
    }
  };

  const getSelectedStore = () => selectedStore.value;
  const getAvailableStores = () => availableStores.value;
  const getIsLoading = () => isLoading.value;
  const getError = () => error.value;

  return {
    stores,
    selectedStore,
    isFetchingStores,
    getStores,
    fetchStores,
    selectStore,
    getStoreBySlug,
    getGraphQLClient,
    forceReloadGraphQLClient,
    logCurrentEndpoint,
    initializeStore,
    getSelectedStore,
    getAvailableStores,
    getIsLoading,
    getError,
    availableStores,
    isLoading,
    error
  };
}; 