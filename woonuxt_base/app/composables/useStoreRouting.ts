import { computed } from 'vue'
import { useRoute } from 'vue-router'

export const useStoreRouting = () => {
  const route = useRoute()

  // Get the current store slug from the route
  const currentStoreSlug = computed(() => {
    // Check if we're on a store-specific page
    if (route.name?.toString().startsWith('store-')) {
      return route.params.slug as string
    }
    return null
  })

  // Generate store-aware URLs
  const getStoreUrl = (path: string, storeSlug?: string) => {
    const slug = storeSlug || currentStoreSlug.value
    if (slug) {
      return `/store/${slug}${path}`
    }
    // Fallback to root path if no store context
    return path
  }

  // Specific URL generators
  const getProductUrl = (productSlug: string, storeSlug?: string) => {
    return getStoreUrl(`/product/${productSlug}`, storeSlug)
  }

  const getCategoryUrl = (categorySlug: string, storeSlug?: string) => {
    return getStoreUrl(`/product-category/${categorySlug}`, storeSlug)
  }

  const getProductsUrl = (storeSlug?: string) => {
    return getStoreUrl('/products', storeSlug)
  }

  const getCategoriesUrl = (storeSlug?: string) => {
    return getStoreUrl('/categories', storeSlug)
  }

  const getCheckoutUrl = (storeSlug?: string) => {
    return getStoreUrl('/checkout', storeSlug)
  }

  const getWishlistUrl = (storeSlug?: string) => {
    return getStoreUrl('/wishlist', storeSlug)
  }

  return {
    currentStoreSlug,
    getStoreUrl,
    getProductUrl,
    getCategoryUrl,
    getProductsUrl,
    getCategoriesUrl,
    getCheckoutUrl,
    getWishlistUrl
  }
} 