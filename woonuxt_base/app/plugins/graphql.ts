import { defineNuxtPlugin } from '#app'
import type { GqlClientConfig, GqlInstance } from '../composables/useStoreManager'

export default defineNuxtPlugin((nuxtApp) => {
  // Initialize the GQL instance
  const gqlInstance: GqlInstance = {
    clients: {},
    default: {
      host: process.env.GQL_HOST || 'http://localhost:4000/graphql',
      query: async (query: string, variables?: any) => {
        console.log('Default client executing query on:', gqlInstance.default.host)
        console.log('Query:', query)
        console.log('Variables:', variables)

        try {
          const response = await fetch(gqlInstance.default.host, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Origin': process.env.APP_HOST || 'http://localhost:3000'
            },
            credentials: 'include' as RequestCredentials,
            body: JSON.stringify({
              query,
              variables
            })
          })

          console.log('GraphQL Response Status:', response.status)
          if (!response.ok) {
            const text = await response.text()
            console.error('GraphQL Error Response:', text)
            throw new Error(`GraphQL request failed: ${response.status} ${text}`)
          }

          const data = await response.json()
          console.log('GraphQL Response Data:', data)

          if (data.errors) {
            console.error('GraphQL Errors:', data.errors)
            throw new Error(data.errors[0].message)
          }

          return data
        } catch (error) {
          console.error('GraphQL Query Error:', error)
          throw error
        }
      }
    },
    create: (config: GqlClientConfig) => {
      console.log('Creating new GraphQL client with config:', config)
      
      return {
        host: config.host,
        query: async (query: string, variables?: any) => {
          console.log('Executing GraphQL query on host:', config.host)
          console.log('Query:', query)
          console.log('Variables:', variables)

          try {
            const response = await fetch(config.host, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...config.headers
              },
              mode: config.corsOptions.mode as RequestMode,
              credentials: config.corsOptions.credentials as RequestCredentials,
              body: JSON.stringify({
                query,
                variables
              })
            })

            console.log('GraphQL Response Status:', response.status)
            if (!response.ok) {
              const text = await response.text()
              console.error('GraphQL Error Response:', text)
              throw new Error(`GraphQL request failed: ${response.status} ${text}`)
            }

            const data = await response.json()
            console.log('GraphQL Response Data:', data)

            if (data.errors) {
              console.error('GraphQL Errors:', data.errors)
              throw new Error(data.errors[0].message)
            }

            return data
          } catch (error) {
            console.error('GraphQL Query Error:', error)
            throw error
          }
        }
      }
    }
  }

  console.log('GraphQL plugin initialized with default host:', gqlInstance.default.host)
  
  // Inject the GQL instance into the Nuxt app
  nuxtApp.provide('gql', gqlInstance)
}) 