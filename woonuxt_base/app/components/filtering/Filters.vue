<script setup lang="ts">
import { TaxonomyEnum } from '#woo';

const { isFiltersActive } = useFiltering();
const { removeBodyClass } = useHelpers();
const runtimeConfig = useRuntimeConfig();
const { storeSettings } = useAppConfig();

// Store context
const { currentStore } = useStoreManager();

// hide-categories prop is used to hide the category filter on the product category page
const { hideCategories } = defineProps({ hideCategories: { type: Boolean, default: false } });

const globalProductAttributes = (runtimeConfig?.public?.GLOBAL_PRODUCT_ATTRIBUTES as WooNuxtFilter[]) || [];
const taxonomies = globalProductAttributes.map((attr) => attr?.slug?.toUpperCase().replace(/_/g, '')) as TaxonomyEnum[];

// Define term type
interface Term {
  taxonomyName: string | null;
  name: string | null;
  slug: string | null;
  count: number | null;
}

// Make terms reactive to the current store
const terms = ref<Term[]>([]);
const isLoading = ref(false);
const productCategoryTerms = computed(() => terms.value?.filter((term) => term.taxonomyName === 'product_cat') || []);
const attributesWithTerms = computed(() => 
  globalProductAttributes.map((attr) => ({ 
    ...attr, 
    terms: terms.value?.filter((term) => term.taxonomyName === attr.slug) || []
  }))
);

// Function to fetch terms for the current store
const fetchTerms = async () => {
  if (!currentStore.value) {
    console.log('No current store set, skipping terms fetch');
    return;
  }

  if (isLoading.value) {
    console.log('Already loading terms, skipping...');
    return;
  }

  isLoading.value = true;
  
  try {
    console.log('Fetching terms for store:', currentStore.value.site_name);
    
    // Get the GraphQL client that should be configured for the current store
    const { $gql } = useNuxtApp();
    
    if (!$gql || !($gql as any)?.default) {
      console.error('GraphQL client not available');
      return;
    }

    const gqlClient = ($gql as any).default;

    // Use the GraphQL client directly to ensure we're using the correct endpoint
    const query = `
      query getAllTerms($hideEmpty: Boolean = true, $taxonomies: [TaxonomyEnum]!, $first: Int = 100) {
        terms(where: { taxonomies: $taxonomies, hideEmpty: $hideEmpty }, first: $first) {
          nodes {
            taxonomyName
            name
            slug
            count
          }
        }
      }
    `;

    const variables = {
      taxonomies: [...taxonomies, TaxonomyEnum.PRODUCTCATEGORY],
      hideEmpty: true,
      first: 100
    };

    console.log('Executing query with variables:', variables);
    console.log('Using GraphQL endpoint:', gqlClient.host);
    
    const result = await gqlClient.query(query, variables);
    
    if (result?.data?.terms?.nodes) {
      terms.value = result.data.terms.nodes;
      console.log('Terms fetched successfully:', terms.value.length, 'from endpoint:', gqlClient.host);
    } else {
      console.warn('No terms found in response:', result);
      terms.value = [];
    }
  } catch (error) {
    console.error('Error fetching terms for store:', currentStore.value.site_name, error);
    terms.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Watch for store changes and refetch terms
watch(currentStore, async (newStore, oldStore) => {
  if (newStore && newStore !== oldStore) {
    console.log('Store changed from:', oldStore?.site_name || 'none', 'to:', newStore.site_name);
    // Add a small delay to ensure GraphQL client is updated
    await nextTick();
    setTimeout(() => {
      fetchTerms();
    }, 100);
  }
}, { immediate: false });

// Initial load when component mounts
onMounted(async () => {
  console.log('Filters component mounted, current store:', currentStore.value?.site_name);
  if (currentStore.value) {
    await fetchTerms();
  } else {
    // If no store is set yet, wait for it
    const unwatch = watch(currentStore, async (newStore) => {
      if (newStore) {
        console.log('Store set after mount:', newStore.site_name);
        await fetchTerms();
        unwatch(); // Stop watching once we've loaded
      }
    });
  }
});
</script>

<template>
  <aside id="filters">
    <OrderByDropdown class="block w-full md:hidden" />
    <div class="relative z-30 grid mb-12 space-y-8 divide-y">
      <PriceFilter />
      <CategoryFilter v-if="!hideCategories" :terms="productCategoryTerms" />
      <div v-for="attribute in attributesWithTerms" :key="attribute.slug">
        <ColorFilter v-if="attribute.slug == 'pa_color' || attribute.slug == 'pa_colour'" :attribute />
        <GlobalFilter v-else :attribute />
      </div>
      <OnSaleFilter />
      <LazyStarRatingFilter v-if="storeSettings.showReviews" />
      <LazyResetFiltersButton v-if="isFiltersActive" />
    </div>
  </aside>
  <div class="fixed inset-0 z-50 hidden bg-black opacity-25 filter-overlay" @click="removeBodyClass('show-filters')"></div>
</template>

<style lang="postcss">
.show-filters .filter-overlay {
  @apply block;
}
.show-filters {
  overflow: hidden;
}

#filters {
  @apply w-[280px];

  & .slider-connect {
    @apply bg-primary;
  }

  &::-webkit-scrollbar {
    display: none;
  }
}

.price-input {
  @apply border rounded-xl outline-none leading-tight w-full p-2 transition-all;

  &.active {
    @apply border-gray-400 pl-6;
  }
}

@media (max-width: 768px) {
  #filters {
    @apply bg-white h-full p-8 transform pl-2 transition-all ease-in-out bottom-0 left-4 -translate-x-[110vw] duration-300 overflow-auto fixed;

    box-shadow:
      -100px 0 0 white,
      -200px 0 0 white,
      -300px 0 0 white;
    z-index: 60;
  }

  .show-filters #filters {
    @apply transform-none;
  }
}
</style>
