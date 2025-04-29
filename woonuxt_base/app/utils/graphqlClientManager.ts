/**
 * GraphQL Client Manager
 * 
 * This utility provides direct control over the GraphQL client used by the application,
 * allowing for runtime endpoint switching and client reinitialization.
 */

import { ref } from 'vue';
import { useGql } from '#imports';

// Track the current endpoint and client
const currentEndpoint = ref<string | null>(null);
let gqlClient: any = null;

// Initialize the client with a specific endpoint
export function initializeClient(endpoint: string) {
  console.log(`Initializing GraphQL client with endpoint: ${endpoint}`);
  currentEndpoint.value = endpoint;
  
  try {
    // Use the imported useGql hook
    gqlClient = useGql();
    
    // Save endpoint to localStorage for persistence
    if (process.client) {
      localStorage.setItem('graphql_endpoint', endpoint);
    }
    
    // Try to set global references that the Nuxt GraphQL client might use
    if (process.client) {
      // @ts-ignore
      window.__NUXT_GRAPHQL_ENDPOINT = endpoint;
      
      // Dispatch event for any listeners
      window.dispatchEvent(new CustomEvent('graphql-endpoint-set', { 
        detail: { endpoint } 
      }));
    }
    
    return gqlClient;
  } catch (err) {
    console.error('Error initializing GraphQL client:', err);
    return null;
  }
}

// Get the current client (or initialize with last endpoint if not available)
export function getClient() {
  if (!gqlClient && process.client) {
    // Try to recover from localStorage
    const savedEndpoint = localStorage.getItem('graphql_endpoint');
    if (savedEndpoint) {
      return initializeClient(savedEndpoint);
    }
  }
  
  return gqlClient;
}

// Execute a GraphQL query using the current client
export async function executeQuery({ query, variables = {} }: { query: string, variables?: any }) {
  const client = getClient();
  
  if (!client || !currentEndpoint.value) {
    throw new Error('GraphQL client not initialized. Call initializeClient first.');
  }
  
  try {
    console.log(`Executing query against endpoint: ${currentEndpoint.value}`);
    return await client(currentEndpoint.value, { query, variables });
  } catch (err) {
    console.error('Error executing GraphQL query:', err);
    throw err;
  }
}

// Reset the GraphQL client state
export function resetClient() {
  console.log('Resetting GraphQL client');
  gqlClient = null;
  currentEndpoint.value = null;
  
  // Clear localStorage
  if (process.client) {
    localStorage.removeItem('graphql_endpoint');
    
    // Dispatch event for any listeners
    window.dispatchEvent(new CustomEvent('graphql-client-reset'));
    
    // Hard refresh the page if needed
    window.location.reload();
  }
}

// Get the current endpoint
export function getCurrentEndpoint() {
  return currentEndpoint.value;
} 