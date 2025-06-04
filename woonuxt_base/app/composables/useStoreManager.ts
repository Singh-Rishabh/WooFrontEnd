import { ref, computed } from 'vue'
import { useNuxtApp, useRuntimeConfig } from '#app'

interface Store {
  site_id: number
  site_url: string
  site_name: string
  admin_email: string
  language: string
}

// Utility function to extract store slug from site_url
export const getStoreSlugFromUrl = (siteUrl: string): string => {
  try {
    const url = new URL(siteUrl)
    const hostname = url.hostname
    
    // Extract the first part before .site.cataloghub.in
    const subdomain = hostname.split('.')[0]
    
    return subdomain || 'unknown'
  } catch (error) {
    console.error('Error parsing site URL:', siteUrl, error)
    // Fallback to original method if URL parsing fails
    return siteUrl
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
}

export interface GqlClient {
  host: string
  query: (query: string, variables?: any) => Promise<any>
}

export interface GqlClientConfig {
  host: string
  corsOptions: { mode: string; credentials: string }
  headers: { Origin: string }
}

export interface GqlInstance {
  clients: Record<string, GqlClientConfig>
  default: GqlClient
  create: (config: GqlClientConfig) => GqlClient
}

export const useStoreManager = () => {
  const nuxtApp = useNuxtApp()
  const currentStore = ref<Store | null>(null)
  const stores = ref<Store[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Get GraphQL client
  const getGqlClient = () => {
    console.log('GQL instance:', nuxtApp.$gql)
    return nuxtApp.$gql as unknown as GqlInstance
  }

  // Update GraphQL endpoint for current store
  const updateGqlEndpoint = (store: Store) => {
    console.log('store is ', store)
    const gql = getGqlClient()
    
    if (!gql) {
      console.error('GraphQL client not initialized')
      return
    }

    const newEndpoint = `${store.site_url}/graphql`
    console.log('Updating GraphQL endpoint to:', newEndpoint)

    const clientConfig: GqlClientConfig = {
      host: newEndpoint,
      corsOptions: { mode: 'cors', credentials: 'include' },
      headers: { Origin: window?.location?.origin || 'http://localhost:3000' }
    }

    // Create a new client for this store
    const clientId = `store-${store.site_id}`
    gql.clients[clientId] = clientConfig

    // Create and set as default client
    console.log('Creating new client with config:', clientConfig)
    const newClient = gql.create(clientConfig)
    console.log('New client created:', newClient)
    
    // Set as default and verify
    gql.default = newClient
    console.log('Default client updated, new host:', gql.default.host)
    
    return gql.default
  }

  // Fetch all stores
  const fetchStores = async () => {
    try {
      loading.value = true
      const response = await fetch('https://site.cataloghub.in/wp-json/custom/v1/view-all-sites')
      const data = await response.json()
      stores.value = data
      
      // After fetching stores, try to restore from localStorage
      if (process.client && !currentStore.value) {
        await initializeFromStorage()
      }
    } catch (err) {
      error.value = 'Failed to fetch stores'
      console.error('Error fetching stores:', err)
    } finally {
      loading.value = false
    }
  }

  // Set current store
  const setCurrentStore = (store: Store) => {
    console.log('Setting current store:', store)
    currentStore.value = store
    console.log('Current store value after set:', currentStore.value)
    
    // Store the current store info in localStorage for this tab
    if (process.client) {
      localStorage.setItem('currentStoreId', store.site_id.toString())
      localStorage.setItem('currentStoreName', store.site_name)
      localStorage.setItem('currentStoreUrl', store.site_url)
      console.log('Store info saved to localStorage')
    }
    
    // Update GraphQL endpoint
    console.log('Updating GraphQL endpoint for store:', store.site_name)
    const updatedClient = updateGqlEndpoint(store)
    console.log('GraphQL client updated:', !!updatedClient)
    
    return currentStore.value
  }

  // Get current store from localStorage
  const initializeFromStorage = async () => {
    console.log('Initializing from localStorage')
    if (process.client && localStorage.getItem('currentStoreId')) {
      const storeId = parseInt(localStorage.getItem('currentStoreId') || '0')
      console.log('Found stored storeId:', storeId)
      
      // If stores are not loaded yet, fetch them first
      if (!stores.value.length) {
        console.log('Stores not loaded, fetching first...')
        await fetchStores()
      }
      
      const store = stores.value.find(s => s.site_id === storeId)
      if (store) {
        console.log('Found stored store:', store.site_name)
        setCurrentStore(store)
        return true
      } else {
        console.log('Stored store not found in available stores')
      }
    } else {
      console.log('No stored store found in localStorage')
    }
    return false
  }

  // Initialize on creation if we're on the client side
  if (process.client) {
    console.log('useStoreManager: Initializing on client side')
    initializeFromStorage()
  }

  // Get products for current store
  const fetchStoreProducts = async (store: Store, first: number = 10) => {
    const gql = getGqlClient()
    if (!gql?.default) {
      throw new Error('GraphQL client not initialized')
    }

    try {
      console.log('Fetching products for store:', store.site_name)
      console.log('Using GraphQL endpoint:', gql.default.host)
      
      const query = `
        query GetProducts($first: Int!) {
          products(first: $first) {
            nodes {
              id
              databaseId
              name
              type
              slug
              description
              shortDescription
              averageRating
              reviewCount
              image {
                id
                sourceUrl
                producCardSourceUrl: sourceUrl(size: WOOCOMMERCE_THUMBNAIL)
                altText
                title
              }
              ... on SimpleProduct {
                price
                regularPrice
                salePrice
              }
              ... on VariableProduct {
                price
                regularPrice
                salePrice
              }
            }
          }
        }
      `

      console.log('Executing products query with variables:', { first })
      const result = await gql.default.query(query, { first })
      console.log('Raw products response:', result)
      const data = result?.data
      console.log('Products response data:', data)
      return data?.products?.nodes || []
    } catch (err) {
      console.error(`Error fetching products for store ${store.site_name}:`, err)
      throw err
    }
  }

  // Get categories for current store
  const fetchStoreCategories = async (store: Store, first: number = 10) => {
    const gql = getGqlClient()
    if (!gql?.default) {
      throw new Error('GraphQL client not initialized')
    }

    try {
      console.log('Fetching categories for store:', store.site_name)
      console.log('Using GraphQL endpoint:', gql.default.host)
      
      const query = `
        query GetCategories($first: Int!) {
          productCategories(first: $first) {
            nodes {
              id
              databaseId
              name
              slug
              description
              image {
                id
                sourceUrl
                altText
              }
              count
            }
          }
        }
      `

      console.log('Executing categories query with variables:', { first })
      const result = await gql.default.query(query, { first })
      console.log('Raw categories response:', result)
      const data = result?.data
      console.log('Categories response data:', data)
      return data?.productCategories?.nodes || []
    } catch (err) {
      console.error(`Error fetching categories for store ${store.site_name}:`, err)
      throw err
    }
  }

  return {
    stores,
    currentStore: computed(() => currentStore.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    fetchStores,
    setCurrentStore,
    initializeFromStorage,
    fetchStoreProducts,
    fetchStoreCategories,
    getStoreSlugFromUrl
  }
} 