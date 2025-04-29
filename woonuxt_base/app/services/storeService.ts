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
            // Try to continue with fallback methods rather than failing immediately
          }
          
          let data;
          let useDirectFetch = !mainSiteClient;
          
          if (mainSiteClient) {
            // Try different ways to call the GraphQL client
            console.log('Attempting to call GraphQL client...');
            
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
                useDirectFetch = true;
              }
            }
          }
          
          // If GraphQL methods failed, try direct fetch
          if (useDirectFetch) {
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
                  console.log('Sample store data:', jsonData[0]);
                  data = {
                    wooMultisiteStores: {
                      nodes: jsonData.map((site: any, index: number) => {
                        // Always extract slug from site_url if not present
                        let slug: string = typeof site.slug === 'string' ? site.slug : '';
                        if (!slug && site.site_url) {
                          slug = extractSlugFromUrl(site.site_url, `store-${index + 1}`);
                        }
                        // If slug is still not set, fallback
                        if (!slug) slug = `store-${index + 1}`;
                        return {
                          id: site.site_id || site.id || String(index + 1),
                          name: site.site_name || site.title?.rendered || `Store ${index + 1}`,
                          slug,
                          url: site.site_url || site.url || site.link,
                          graphqlEndpoint: site.graphqlEndpoint || `${site.site_url || site.url || site.link}/graphql`,
                          description: site.description?.rendered || ""
                        };
                      })
                    }
                  };
                }
              } else {
                // If we're in SSR and can't use direct fetch, use fallback mock data
                data = getFallbackStoreData();
              }
            } catch (fetchError) {
              console.error('Error with direct fetch:', fetchError);
              // Fall back to mock data
              data = getFallbackStoreData();
            }
          }
          
          if (!data || !data.wooMultisiteStores?.nodes) {
            console.warn('No store data returned, using fallback data');
            data = getFallbackStoreData();
          }
          
          // Normalize the response structure
          const storeNodes = data.wooMultisiteStores.nodes;
          
          // Update the stores state
          stores.value = storeNodes.map((node: any, index: number) => {
            let slug: string = typeof node.slug === 'string' ? node.slug : '';
            const urlStr = typeof node.url === 'string' ? node.url : '';
            if (!slug && urlStr) {
              slug = extractSlugFromUrl(urlStr, `store-${index + 1}`);
            }
            if (!slug) slug = `store-${index + 1}`;
            return {
              id: node.id || '0',
              name: node.name || 'Unknown Store',
              slug,
              url: urlStr || 'https://cataloghub.in',
              graphqlEndpoint: typeof node.graphqlEndpoint === 'string' ? node.graphqlEndpoint : 'https://cataloghub.in/graphql',
              description: typeof node.description === 'string' ? node.description : ''
            };
          });
          
          console.log(`Stores loaded successfully: ${stores.value.length}`);
          
          // Store fetched time
          lastFetchTimestamp.value = now;
          
          // Return the stores
          isFetchingStores.value = false;
          resolve(stores.value);
        } catch (err) {
          console.error('Error fetching stores:', err);
          isFetchingStores.value = false;
          
          // If we have fallback mock data, return that instead of failing
          const fallbackData = getFallbackStoreData();
          stores.value = fallbackData.wooMultisiteStores.nodes.map((node: any, index: number) => {
            let slug: string = typeof node.slug === 'string' ? node.slug : '';
            const urlStr = typeof node.url === 'string' ? node.url : '';
            if (!slug && urlStr) {
              slug = extractSlugFromUrl(urlStr, `store-${index + 1}`);
            }
            if (!slug) slug = `store-${index + 1}`;
            return {
              id: node.id || '0',
              name: node.name || 'Unknown Store',
              slug,
              url: urlStr || 'https://cataloghub.in',
              graphqlEndpoint: typeof node.graphqlEndpoint === 'string' ? node.graphqlEndpoint : 'https://cataloghub.in/graphql',
              description: typeof node.description === 'string' ? node.description : ''
            };
          });
          
          if (stores.value.length > 0) {
            console.warn('Using fallback store data due to error');
            resolve(stores.value);
          } else {
            reject(new Error('Failed to initialize GraphQL client'));
          }
        }
      } catch (err) {
        console.error('Unexpected error in getStores:', err);
        isFetchingStores.value = false;
        reject(err);
      } finally {
        // Clear promise reference after completion
        setTimeout(() => {
          fetchPromise.value = null;
        }, 1000);
      }
    });
    
    return fetchPromise.value;
  };

  // Helper function to provide fallback store data when API requests fail
  const getFallbackStoreData = () => {
    return {
      wooMultisiteStores: {
        nodes: [
          {
            id: '1',
            name: 'Main Store',
            slug: 'main-store',
            url: 'https://cataloghub.in',
            graphqlEndpoint: 'https://cataloghub.in/graphql',
            description: 'Main Cataloghub Store'
          },
          {
            id: '2',
            name: 'Shiv Shakti Collection',
            slug: 'store-2',
            url: 'https://shivshakti.site.cataloghub.in',
            graphqlEndpoint: 'https://shivshakti.site.cataloghub.in/graphql',
            description: 'Shiv Shakti Collection Store'
          },
          // Add other known stores here as fallbacks
        ]
      }
    };
  };

  // Utility function to extract slug from a site URL
  function extractSlugFromUrl(siteUrl: string, fallback: string): string {
    try {
      const url = new URL(siteUrl);
      const match = url.hostname.match(/^([^.]+)\./);
      return match ? match[1] : fallback;
    } catch (e) {
      return fallback;
    }
  }

  /**
   * Get a GraphQL client for a specific store
   */
  const getGraphQLClient = (endpoint: string): any => {
    // Initialize if not already set
    if (!graphqlClients.value[endpoint]) {
      console.log('Creating new GraphQL client for endpoint:', endpoint);
      try {
        graphqlClients.value[endpoint] = useGql();
        console.log('GraphQL client created successfully for endpoint:', endpoint);
      } catch (err) {
        console.error('Failed to create GraphQL client:', err);
        // Return a dummy client that logs errors but doesn't crash
        return {
          __dummy: true,
          __endpoint: endpoint,
          __error: err,
          // Create a function that returns a rejected promise with a clear error
          default: async () => {
            throw new Error(`GraphQL client for endpoint ${endpoint} is not available`);
          }
        };
      }
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
    try {
      // First, clear the existing client
      delete graphqlClients.value[endpoint];
      
      // Then create a new one
      try {
        graphqlClients.value[endpoint] = useGql();
        
        // Debug: Check if the client was created
        console.log('GraphQL client created:', !!graphqlClients.value[endpoint]);
        
        // Debug: Save the current endpoint to a global variable for debugging
        if (process.client) {
          (window as any).__currentGraphQLEndpoint = endpoint;
          
          // Save selected store to localStorage for persistence
          try {
            localStorage.setItem('selectedStore', JSON.stringify(selectedStore.value));
            localStorage.setItem('selectedGraphQLEndpoint', endpoint);
            console.log('Saved selected store and endpoint to localStorage');
            
            // Also set a Nuxt-specific global variable if it might help
            (window as any).__NUXT__GRAPHQL_ENDPOINT = endpoint;
            
            // Dispatch an event to notify any Nuxt plugins or modules
            window.dispatchEvent(new CustomEvent('nuxt-graphql-endpoint-changed', {
              detail: { endpoint }
            }));
          } catch (e) {
            console.error('Failed to save store to localStorage:', e);
          }
        }
        
        return graphqlClients.value[endpoint];
      } catch (clientErr) {
        console.error('Failed to create new GraphQL client:', clientErr);
        
        // Create a dummy client that doesn't crash but returns errors
        graphqlClients.value[endpoint] = {
          __dummy: true,
          __endpoint: endpoint,
          __error: clientErr
        };
        
        return null;
      }
    } catch (err) {
      console.error('Error reloading GraphQL client:', err);
      return null;
    }
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
   * Select a store by slug or store object
   */
  const selectStore = async (slugOrStore: string | Store): Promise<Store | null> => {
    // Allow passing either slug or store object
    let storeObj: Store | null = null;
    
    if (typeof slugOrStore === 'string') {
      // If a string slug was provided, find the store
      // If we don't have any stores, fetch them first
      if (!stores.value || stores.value.length === 0) {
        await getStores();
      }
      
      // Find the store by slug
      storeObj = stores.value.find((s) => s.slug === slugOrStore) || null;
    } else {
      // If a store object was directly provided
      storeObj = slugOrStore;
    }
    
    if (!storeObj) {
      console.error(`Store with slug "${typeof slugOrStore === 'string' ? slugOrStore : 'object'}" not found`);
      return null;
    }
    
    // Check if this is a new store
    const isNewStore = !selectedStore.value || selectedStore.value.slug !== storeObj.slug;
    
    // If this is a new store, update the selected store
    if (isNewStore) {
      console.log(`Selecting store: ${storeObj.name} (${storeObj.slug})`);
      console.log(`GraphQL endpoint: ${storeObj.graphqlEndpoint}`);
      
      // Update the selected store
      selectedStore.value = storeObj;
      
      // Save to localStorage for persistence
      if (process.client) {
        try {
          localStorage.setItem('selectedStore', JSON.stringify(storeObj));
          localStorage.setItem('selectedGraphQLEndpoint', storeObj.graphqlEndpoint);
          // Set cookie for SSR
          document.cookie = `selectedStore=${encodeURIComponent(JSON.stringify(storeObj))}; path=/;`;
          console.log('Saved selected store to localStorage and cookie');
          // Import and use our GraphQL client manager
          const { initializeClient } = await import('../utils/graphqlClientManager');
          initializeClient(storeObj.graphqlEndpoint);
        } catch (e) {
          console.error('Failed to save store to localStorage/cookie:', e);
        }
      }
      
      // Ensure we have a client for this store and force reload it
      getGraphQLClient(storeObj.graphqlEndpoint);
      
      // Force reload the GraphQL client to ensure it's using the new endpoint
      forceReloadGraphQLClient();
    }
    
    return storeObj;
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
      console.log('Initializing store service...');
      
      // Try to get previously selected store from localStorage
      if (process.client) {
        const storedStore = localStorage.getItem('selectedStore');
        const storedEndpoint = localStorage.getItem('selectedGraphQLEndpoint');
        
        console.log('Stored store in localStorage:', storedStore ? 'Found' : 'Not found');
        console.log('Stored GraphQL endpoint:', storedEndpoint || 'Not found');
        
        // Initialize GraphQL client with the stored endpoint if available
        if (storedEndpoint) {
          try {
            console.log('Attempting to initialize GraphQL client with stored endpoint:', storedEndpoint);
            // Import directly from the graphqlClientManager
            const { initializeClient } = await import('../utils/graphqlClientManager');
            initializeClient(storedEndpoint);
          } catch (e) {
            console.error('Error initializing GraphQL client from stored endpoint:', e);
            // Don't rethrow, we'll try other methods
          }
        }
        
        if (storedStore) {
          try {
            const storeData = JSON.parse(storedStore);
            if (storeData && storeData.slug) {
              console.log('Found stored store:', storeData.name);
              // Try to select the store, but don't fail completely if it fails
              try {
                await selectStore(storeData);
              } catch (selectErr) {
                console.error('Error selecting stored store:', selectErr);
                // Clear the stored data as it might be invalid
                localStorage.removeItem('selectedStore');
                localStorage.removeItem('selectedGraphQLEndpoint');
              }
            }
          } catch (e) {
            console.error('Error parsing stored store:', e);
            // Clear the stored data as it might be corrupt
            localStorage.removeItem('selectedStore');
            localStorage.removeItem('selectedGraphQLEndpoint');
          }
        }
      }
      
      // Always try to fetch the latest stores
      try {
        await getStores();
        return true;
      } catch (storeErr) {
        console.warn('Could not fetch stores, but we might have loaded a store from localStorage:', storeErr);
        // If we have a selected store already, consider it a success
        return !!selectedStore.value;
      }
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

  /**
   * Get the currently active GraphQL client
   */
  const getCurrentGraphQLClient = () => {
    // If no store is selected, return null
    if (!selectedStore.value) {
      console.warn('No store selected, cannot get current GraphQL client');
      return null;
    }
    
    const endpoint = selectedStore.value.graphqlEndpoint;
    return getGraphQLClient(endpoint);
  };

  /**
   * Reset all GraphQL clients and state
   */
  const resetGraphQLState = async (): Promise<void> => {
    try {
      console.log('Resetting GraphQL state...');
      
      // Clear GraphQL clients cache
      if (typeof window !== 'undefined') {
        console.log('Clearing localStorage items...');
        // Remove items from localStorage
        localStorage.removeItem('selectedStore');
        localStorage.removeItem('selectedGraphQLEndpoint');
        localStorage.removeItem('graphql_endpoint');
        
        // Dispatch event to notify the plugin about endpoint change
        window.dispatchEvent(new CustomEvent('graphql-endpoint-set', {
          detail: {
            endpoint: null, // Reset to null/default
          }
        }));
      }
      
      // Reset selected store to null
      selectedStore.value = null;
      
      console.log('GraphQL state reset complete.');
      
      // Force reload the page to apply changes
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error resetting GraphQL state:', error);
      
      // Force reload as last resort
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  return {
    stores,
    selectedStore,
    isFetchingStores,
    getStores,
    fetchStores,
    selectStore,
    getStoreBySlug,
    getGraphQLClient,
    getCurrentGraphQLClient,
    forceReloadGraphQLClient,
    resetGraphQLState,
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