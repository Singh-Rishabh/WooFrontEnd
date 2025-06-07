<script setup lang="ts">
const runtimeConfig = useRuntimeConfig();
const route = useRoute();

const { product } = defineProps<{ product: Product }>();

// Check if we're in a store context
const isInStoreContext = computed(() => route.name?.toString().startsWith('store-'));
const currentStoreSlug = computed(() => isInStoreContext.value ? route.params.slug as string : null);

// Store-aware home URL
const homeUrl = computed(() => {
  if (currentStoreSlug.value) {
    return `/store/${currentStoreSlug.value}`;
  }
  return '/';
});

// Store-aware URLs for breadcrumb items
const getStoreAwareUrl = (path: string) => {
  if (currentStoreSlug.value) {
    return `/store/${currentStoreSlug.value}${path}`;
  }
  return path;
};

// TODO fetch perma link from WP API
const productCategoryPermallink = runtimeConfig?.public?.PRODUCT_CATEGORY_PERMALINK || '/product-category/';
const primaryCategory = computed(() => product.productCategories?.nodes[0]);
const format = computed(() => [
  { name: 'Products', slug: getStoreAwareUrl('/products') },
  {
    name: primaryCategory.value?.name,
    slug: getStoreAwareUrl(`${String(productCategoryPermallink)}${primaryCategory.value?.slug}`),
  },
  { name: product.name },
]);
</script>

<template>
  <div class="flex text-sm leading-none text-gray-400 gap-1 items-center">
    <span>
      <NuxtLink :to="homeUrl" class="hover:text-primary">{{ $t('messages.general.home') }}</NuxtLink>
      <span> /</span>
    </span>
    <span v-for="(link, i) in format" :key="link.name || i">
      <NuxtLink v-if="link.slug" :to="decodeURIComponent(link.slug)" class="hover:text-primary">{{ link.name }}</NuxtLink>
      <span v-else class="text-gray-800">{{ link.name }}</span>
      <span v-if="i + 1 < format.length"> /</span>
    </span>
  </div>
</template>
