<script lang="ts" setup>
import { StockStatusEnum, ProductTypesEnum, type AddToCartInput } from '#woo';

const route = useRoute();
const { storeSettings } = useAppConfig();
const { arraysEqual, formatArray, checkForVariationTypeOfAny } = useHelpers();
const { addToCart, isUpdatingCart } = useCart();
const { t } = useI18n();
const productSlug = route.params.productSlug as string; // Product slug from route
const storeSlug = route.params.slug as string; // Store slug from parent route

// Store management
const { currentStore, setCurrentStore, stores, fetchStores, getStoreSlugFromUrl } = useStoreManager();

// Product data state
const product = ref<Product | null>(null);
const isLoading = ref(false);
const loadingError = ref<string | null>(null);

// Initialize store if needed and fetch product data
const initializeAndFetchProduct = async () => {
  if (!currentStore.value) {
    if (!stores.value.length) {
      await fetchStores();
    }
    
    // Find store by URL-based slug instead of name-based slug
    const store = stores.value.find((s: any) => 
      getStoreSlugFromUrl(s.site_url) === storeSlug
    );
    
    if (store) {
      await setCurrentStore(store);
    } else {
      loadingError.value = 'Store not found';
      return;
    }
  }

  // Fetch product data using the existing GraphQL query but store-aware
  await fetchProduct();
};

const fetchProduct = async () => {
  if (!currentStore.value) {
    console.error('No current store set');
    loadingError.value = 'Store not initialized';
    return;
  }

  if (isLoading.value) {
    console.log('Already loading product, skipping...');
    return;
  }

  isLoading.value = true;
  
  try {
    console.log('Fetching product for store:', currentStore.value.site_name);
    
    // Get the GraphQL client that should be configured for the current store
    const { $gql } = useNuxtApp();
    
    if (!$gql || !($gql as any)?.default) {
      console.error('GraphQL client not available');
      loadingError.value = 'GraphQL client not available';
      return;
    }

    const gqlClient = ($gql as any).default;

    // Use the existing getProduct query directly from the gql file
    const query = `
      query getProduct($slug: ID!) {
        product(id: $slug, idType: SLUG) {
          name
          type
          databaseId
          id
          metaData {
            id
            key
            value
          }
          slug
          sku
          description
          rawDescription: description(format: RAW)
          shortDescription
          averageRating
          reviewCount
          onSale
          image {
            id
            sourceUrl
            cartSourceUrl: sourceUrl(size: THUMBNAIL)
            producCardSourceUrl: sourceUrl(size: WOOCOMMERCE_THUMBNAIL)
            altText
            title
          }
          galleryImages(first: 20) {
            nodes {
              id
              sourceUrl
              cartSourceUrl: sourceUrl(size: THUMBNAIL)
              producCardSourceUrl: sourceUrl(size: WOOCOMMERCE_THUMBNAIL)
              altText
              title
              databaseId
            }
          }
          productCategories {
            nodes {
              databaseId
              slug
              name
              count
            }
          }
          terms(first: 100) {
            nodes {
              taxonomyName
              slug
            }
          }
          ... on SimpleProduct {
            name
            slug
            price
            rawPrice: price(format: RAW)
            date
            regularPrice
            rawRegularPrice: regularPrice(format: RAW)
            salePrice
            rawSalePrice: salePrice(format: RAW)
            stockStatus
            stockQuantity
            lowStockAmount
            averageRating
            weight
            length
            width
            height
            reviewCount
            onSale
            virtual
            attributes {
              nodes {
                variation
                name
                id
                options
                label
                scope
                ... on GlobalProductAttribute {
                  terms(where: { orderby: MENU_ORDER, order: ASC }) {
                    nodes {
                      name
                      slug
                      taxonomyName
                      databaseId
                    }
                  }
                }
              }
            }
          }
          ... on VariableProduct {
            name
            slug
            price
            rawPrice: price(format: RAW)
            date
            weight
            length
            width
            height
            averageRating
            reviewCount
            onSale
            regularPrice
            rawRegularPrice: regularPrice(format: RAW)
            salePrice
            rawSalePrice: salePrice(format: RAW)
            stockStatus
            totalSales
            stockQuantity
            lowStockAmount
            attributes {
              nodes {
                variation
                name
                id
                options
                label
                scope
                ... on GlobalProductAttribute {
                  terms(where: { orderby: MENU_ORDER, order: ASC }) {
                    nodes {
                      name
                      slug
                      taxonomyName
                      databaseId
                    }
                  }
                }
              }
            }
            defaultAttributes {
              nodes {
                name
                attributeId
                value
                label
              }
            }
            variations(first: 100) {
              nodes {
                name
                databaseId
                price
                regularPrice
                salePrice
                rawSalePrice: salePrice(format: RAW)
                slug
                stockQuantity
                stockStatus
                hasAttributes
                image {
                  id
                  sourceUrl
                  cartSourceUrl: sourceUrl(size: THUMBNAIL)
                  producCardSourceUrl: sourceUrl(size: WOOCOMMERCE_THUMBNAIL)
                  altText
                  title
                }
                attributes {
                  nodes {
                    name
                    attributeId
                    value
                    label
                  }
                }
              }
            }
          }
          ... on ExternalProduct {
            externalUrl
            buttonText
            attributes {
              nodes {
                variation
                name
                id
                options
                label
                scope
                ... on GlobalProductAttribute {
                  terms(where: { orderby: MENU_ORDER, order: ASC }) {
                    nodes {
                      name
                      slug
                      taxonomyName
                      databaseId
                    }
                  }
                }
              }
            }
          }
          related(first: 5) {
            nodes {
              ... on SimpleProduct {
                name
                slug
                price
                rawPrice: price(format: RAW)
                date
                regularPrice
                rawRegularPrice: regularPrice(format: RAW)
                salePrice
                rawSalePrice: salePrice(format: RAW)
                stockStatus
                stockQuantity
                lowStockAmount
                averageRating
                weight
                length
                width
                height
                reviewCount
                onSale
                virtual
                image {
                  id
                  sourceUrl
                  cartSourceUrl: sourceUrl(size: THUMBNAIL)
                  producCardSourceUrl: sourceUrl(size: WOOCOMMERCE_THUMBNAIL)
                  altText
                  title
                }
                galleryImages(first: 20) {
                  nodes {
                    id
                    sourceUrl
                    cartSourceUrl: sourceUrl(size: THUMBNAIL)
                    producCardSourceUrl: sourceUrl(size: WOOCOMMERCE_THUMBNAIL)
                    altText
                    title
                    databaseId
                  }
                }
              }
              ... on VariableProduct {
                name
                slug
                price
                rawPrice: price(format: RAW)
                date
                weight
                length
                width
                height
                image {
                  id
                  sourceUrl
                  cartSourceUrl: sourceUrl(size: THUMBNAIL)
                  producCardSourceUrl: sourceUrl(size: WOOCOMMERCE_THUMBNAIL)
                  altText
                  title
                }
                averageRating
                reviewCount
                onSale
                regularPrice
                rawRegularPrice: regularPrice(format: RAW)
                salePrice
                rawSalePrice: salePrice(format: RAW)
                stockStatus
                totalSales
                stockQuantity
                lowStockAmount
                defaultAttributes {
                  nodes {
                    name
                    attributeId
                    value
                    label
                  }
                }
                variations(first: 100) {
                  nodes {
                    name
                    databaseId
                    price
                    regularPrice
                    salePrice
                    rawSalePrice: salePrice(format: RAW)
                    slug
                    stockQuantity
                    stockStatus
                    hasAttributes
                    image {
                      id
                      sourceUrl
                      cartSourceUrl: sourceUrl(size: THUMBNAIL)
                      producCardSourceUrl: sourceUrl(size: WOOCOMMERCE_THUMBNAIL)
                      altText
                      title
                    }
                    attributes {
                      nodes {
                        name
                        attributeId
                        value
                        label
                      }
                    }
                  }
                }
                galleryImages(first: 20) {
                  nodes {
                    id
                    sourceUrl
                    cartSourceUrl: sourceUrl(size: THUMBNAIL)
                    producCardSourceUrl: sourceUrl(size: WOOCOMMERCE_THUMBNAIL)
                    altText
                    title
                    databaseId
                  }
                }
              }
              ... on ExternalProduct {
                externalUrl
                buttonText
              }
            }
          }
          reviews {
            averageRating
            edges {
              rating
              node {
                content
                id
                date
                author {
                  node {
                    name
                    avatar {
                      url
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    console.log('Executing product query with slug:', productSlug);
    console.log('Using GraphQL endpoint:', gqlClient.host);
    
    const result = await gqlClient.query(query, { slug: productSlug });
    
    if (result?.data?.product) {
      product.value = result.data.product as Product;
      console.log('Product fetched successfully:', product.value?.name, 'from endpoint:', gqlClient.host);
    } else {
      console.warn('No product found in response');
      throw showError({ statusCode: 404, statusMessage: t('messages.shop.productNotFound') });
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    if ((error as any).statusCode === 404) {
      throw error; // Re-throw 404 errors
    }
    loadingError.value = 'Failed to load product';
  } finally {
    isLoading.value = false;
  }
};

// Watch for store changes and refetch product
watch(currentStore, async (newStore, oldStore) => {
  if (newStore && newStore !== oldStore && product.value) {
    console.log('Store changed, refetching product...');
    await fetchProduct();
  }
}, { immediate: false });

// Initialize when component mounts
onMounted(async () => {
  console.log('Product page mounted, current store:', currentStore.value?.site_name);
  await initializeAndFetchProduct();
});

const quantity = ref<number>(1);
const activeVariation = ref<Variation | null>(null);
const variation = ref<VariationAttribute[]>([]);
const indexOfTypeAny = computed<number[]>(() => product.value ? checkForVariationTypeOfAny(product.value) : []);
const attrValues = ref();
const isSimpleProduct = computed<boolean>(() => product.value?.type === ProductTypesEnum.SIMPLE);
const isVariableProduct = computed<boolean>(() => product.value?.type === ProductTypesEnum.VARIABLE);
const isExternalProduct = computed<boolean>(() => product.value?.type === ProductTypesEnum.EXTERNAL);

const type = computed(() => activeVariation.value || product.value);
const selectProductInput = computed<any>(() => ({ productId: type.value?.databaseId, quantity: quantity.value })) as ComputedRef<AddToCartInput>;

const mergeLiveStockStatus = (payload: Product): void => {
  if (!product.value) return;
  
  product.value.stockStatus = payload.stockStatus ?? product.value?.stockStatus;

  payload.variations?.nodes?.forEach((variation: Variation, index: number) => {
    if (product.value?.variations?.nodes[index]) {
      product.value.variations.nodes[index].stockStatus = variation.stockStatus;
    }
  });
};

// Fetch live stock status after product is loaded
watch(product, async (newProduct) => {
  if (newProduct) {
    try {
      const { product: stockProduct } = await GqlGetStockStatus({ slug: productSlug });
      if (stockProduct) mergeLiveStockStatus(stockProduct as Product);
    } catch (error: any) {
      const errorMessage = error?.gqlErrors?.[0].message;
      if (errorMessage) console.error(errorMessage);
    }
  }
}, { immediate: true });

const updateSelectedVariations = (variations: VariationAttribute[]): void => {
  if (!product.value?.variations) return;

  attrValues.value = variations.map((el) => ({ attributeName: el.name, attributeValue: el.value }));
  const clonedVariations = JSON.parse(JSON.stringify(variations));
  const getActiveVariation = product.value.variations?.nodes.filter((variation: any) => {
    // If there is any variation of type ANY set the value to ''
    if (variation.attributes) {
      // Set the value of the variation of type ANY to ''
      indexOfTypeAny.value.forEach((index) => (clonedVariations[index].value = ''));

      return arraysEqual(formatArray(variation.attributes.nodes), formatArray(clonedVariations));
    }
  });

  // Set variation to the selected variation if it exists
  activeVariation.value = getActiveVariation?.[0] || null;

  selectProductInput.value.variationId = activeVariation.value?.databaseId ?? null;
  selectProductInput.value.variation = activeVariation.value ? attrValues.value : null;
  variation.value = variations;
};

const stockStatus = computed(() => {
  if (isVariableProduct.value) {
    return activeVariation.value?.stockStatus || StockStatusEnum.OUT_OF_STOCK;
  }
  return type.value?.stockStatus || StockStatusEnum.OUT_OF_STOCK;
});

const disabledAddToCart = computed(() => {
  const isOutOfStock = stockStatus.value === StockStatusEnum.OUT_OF_STOCK;
  const isInvalidType = !type.value;
  const isCartUpdating = isUpdatingCart.value;
  const isValidActiveVariation = isVariableProduct.value ? !!activeVariation.value : true;
  return isInvalidType || isOutOfStock || isCartUpdating || !isValidActiveVariation;
});
</script>

<template>
  <!-- Loading State -->
  <main v-if="isLoading" class="container relative py-6 xl:max-w-7xl">
    <div class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-gray-600">Loading product...</p>
      </div>
    </div>
  </main>

  <!-- Error State -->
  <main v-else-if="loadingError" class="container relative py-6 xl:max-w-7xl">
    <div class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p class="text-gray-600 mb-4">{{ loadingError }}</p>
        <button 
          @click="initializeAndFetchProduct" 
          class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  </main>

  <!-- Product Content -->
  <main v-else-if="product" class="container relative py-6 xl:max-w-7xl">
    <div>
      <SEOHead :info="product" />
      <Breadcrumb :product class="mb-6" v-if="storeSettings.showBreadcrumbOnSingleProduct" />

      <div class="flex flex-col gap-10 md:flex-row md:justify-between lg:gap-24">
        <ProductImageGallery
          v-if="product.image"
          class="relative flex-1"
          :main-image="product.image"
          :gallery="product.galleryImages!"
          :node="type!"
          :activeVariation="activeVariation || {}" />
        <NuxtImg v-else class="relative flex-1 skeleton" src="/images/placeholder.jpg" :alt="product?.name || 'Product'" />

        <div class="lg:max-w-md xl:max-w-lg md:py-2 w-full">
          <div class="flex justify-between mb-4">
            <div class="flex-1">
              <h1 class="flex flex-wrap items-center gap-2 mb-2 text-2xl font-sesmibold">
                {{ type?.name }}
                <LazyWPAdminLink :link="`/wp-admin/post.php?post=${product.databaseId}&action=edit`">Edit</LazyWPAdminLink>
              </h1>
              <StarRating :rating="product.averageRating || 0" :count="product.reviewCount || 0" v-if="storeSettings.showReviews" />
            </div>
            <ProductPrice class="text-xl" :sale-price="type?.salePrice" :regular-price="type?.regularPrice" />
          </div>

          <div class="grid gap-2 my-8 text-sm empty:hidden">
            <div v-if="!isExternalProduct" class="flex items-center gap-2">
              <span class="text-gray-400">{{ $t('messages.shop.availability') }}: </span>
              <StockStatus :stockStatus @updated="mergeLiveStockStatus" />
            </div>
            <div class="flex items-center gap-2" v-if="storeSettings.showSKU && product.sku">
              <span class="text-gray-400">{{ $t('messages.shop.sku') }}: </span>
              <span>{{ product.sku || 'N/A' }}</span>
            </div>
          </div>

          <div class="mb-8 font-light prose" v-html="product.shortDescription || product.description" />

          <hr />

          <form @submit.prevent="addToCart(selectProductInput)">
            <AttributeSelections
              v-if="isVariableProduct && product.attributes && product.variations"
              class="mt-4 mb-8"
              :attributes="product.attributes.nodes"
              :defaultAttributes="product.defaultAttributes"
              :variations="product.variations.nodes"
              @attrs-changed="updateSelectedVariations" />
            <div
              v-if="isVariableProduct || isSimpleProduct"
              class="fixed bottom-0 left-0 z-10 flex items-center w-full gap-4 p-4 mt-12 bg-white md:static md:bg-transparent bg-opacity-90 md:p-0">
              <input
                v-model="quantity"
                type="number"
                min="1"
                aria-label="Quantity"
                class="bg-white border rounded-lg flex text-left p-2.5 w-20 gap-4 items-center justify-center focus:outline-none" />
              <AddToCartButton class="flex-1 w-full md:max-w-xs" :disabled="disabledAddToCart" :class="{ loading: isUpdatingCart }" />
            </div>
            <a
              v-if="isExternalProduct && product.externalUrl"
              :href="product.externalUrl"
              target="_blank"
              class="rounded-lg flex font-bold bg-gray-800 text-white text-center min-w-[150px] p-2.5 gap-4 items-center justify-center focus:outline-none">
              {{ product?.buttonText || 'View product' }}
            </a>
          </form>

          <div v-if="storeSettings.showProductCategoriesOnSingleProduct && product.productCategories">
            <div class="grid gap-2 my-8 text-sm">
              <div class="flex items-center gap-2">
                <span class="text-gray-400">{{ $t('messages.shop.category', 2) }}:</span>
                <div class="product-categories">
                  <NuxtLink
                    v-for="category in product.productCategories.nodes"
                    :key="category.databaseId"
                    :to="`/store/${storeSlug}/product-category/${decodeURIComponent(category?.slug || '')}`"
                    class="hover:text-primary"
                    :title="category.name"
                    >{{ category.name }}<span class="comma">, </span>
                  </NuxtLink>
                </div>
              </div>
            </div>
            <hr />
          </div>

          <div class="flex flex-wrap gap-4">
            <WishlistButton :product />
            <ShareButton :product />
          </div>
        </div>
      </div>
      <div v-if="product.description || product.reviews" class="my-32">
        <ProductTabs :product />
      </div>
      <div class="my-32" v-if="product.related && storeSettings.showRelatedProducts">
        <div class="mb-4 text-xl font-semibold">{{ $t('messages.shop.youMayLike') }}</div>
        <LazyProductRow :products="product.related.nodes" class="grid-cols-2 md:grid-cols-4 lg:grid-cols-5" />
      </div>
    </div>
  </main>
</template>

<style scoped>
.product-categories > a:last-child .comma {
  display: none;
}

input[type='number']::-webkit-inner-spin-button {
  display: none;
}

input[type='number']::-webkit-outer-spin-button {
  display: none;
}
</style> 