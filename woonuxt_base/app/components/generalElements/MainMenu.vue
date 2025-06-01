<script setup lang="ts">
const { wishlistLink } = useAuth();
const route = useRoute();

// Check if we're in a store context
const isInStoreContext = computed(() => route.name?.toString().startsWith('store-'));
const currentStoreSlug = computed(() => isInStoreContext.value ? route.params.slug as string : null);

// Generate store-aware URLs
const getStoreAwareUrl = (path: string) => {
  if (currentStoreSlug.value) {
    return `/store/${currentStoreSlug.value}${path}`;
  }
  return path;
};
</script>

<template>
  <nav>
    <NuxtLink to="/">{{ $t('messages.general.home') }}</NuxtLink>
    <NuxtLink :to="getStoreAwareUrl('/products')">{{ $t('messages.general.allProducts') }}</NuxtLink>
    <NuxtLink :to="getStoreAwareUrl('/categories')">{{ $t('messages.shop.category', 2) }}</NuxtLink>
    <NuxtLink to="/contact">{{ $t('messages.general.contact') }}</NuxtLink>
    <NuxtLink class="lg:hidden" :to="wishlistLink" :prefetch="false">Wishlist</NuxtLink>
    <NuxtLink class="lg:hidden" to="/my-account" :prefetch="false">My Account</NuxtLink>
  </nav>
</template>
