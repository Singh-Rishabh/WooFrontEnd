<script setup lang="ts">
const route = useRoute();
const { storeSettings } = useAppConfig();
const props = defineProps({
  node: { type: Object as PropType<Product>, required: true },
  index: { type: Number, default: 1 },
});

// Check if we're in a store context
const isInStoreContext = computed(() => route.name?.toString().startsWith('store-'));
const currentStoreSlug = computed(() => isInStoreContext.value ? route.params.slug as string : null);

// Generate store-aware product URL
const getProductUrl = (productSlug: string) => {
  if (currentStoreSlug.value) {
    return `/store/${currentStoreSlug.value}/product/${productSlug}`;
  }
  return `/product/${productSlug}`;
};

const imgWidth = 280;
const imgHeight = Math.round(imgWidth * 1.125);

// example: ?filter=pa_color[green,blue],pa_size[large]
const filterQuery = ref(route.query?.filter as string);
const paColor = ref(filterQuery.value?.split('pa_color[')[1]?.split(']')[0]?.split(',') || []);

// watch filterQuery
watch(
  () => route.query,
  () => {
    filterQuery.value = route.query.filter as string;
    paColor.value = filterQuery.value?.split('pa_color[')[1]?.split(']')[0]?.split(',') || [];
  },
);

const mainImage = computed<string>(() => props.node?.image?.producCardSourceUrl || props.node?.image?.sourceUrl || '/images/placeholder.jpg');
const imagetoDisplay = computed<string>(() => {
  if (paColor.value.length) {
    const activeColorImage = props.node?.variations?.nodes.filter((variation) => {
      const hasMatchingAttributes = variation.attributes?.nodes.some((attribute) => paColor.value.some((color) => attribute?.value?.includes(color)));
      const hasMatchingSlug = paColor.value.some((color) => variation.slug?.includes(color));
      return hasMatchingAttributes || hasMatchingSlug;
    });
    if (activeColorImage?.length) return activeColorImage[0]?.image?.producCardSourceUrl || activeColorImage[0]?.image?.sourceUrl || mainImage.value;
  }
  return mainImage.value;
});
</script>

<template>
  <div class="relative group">
    <NuxtLink v-if="node.slug" :to="getProductUrl(decodeURIComponent(node.slug))" :title="node.name">
      <SaleBadge :node class="absolute top-2 right-2" />
      <NuxtImg
        v-if="imagetoDisplay"
        :width="imgWidth"
        :height="imgHeight"
        :src="imagetoDisplay"
        :alt="node.image?.altText || node.name || 'Product image'"
        :title="node.image?.title || node.name"
        :loading="index <= 3 ? 'eager' : 'lazy'"
        :sizes="`sm:${imgWidth / 2}px md:${imgWidth}px`"
        class="rounded-lg object-top object-cover w-full aspect-9/8"
        placeholder
        placeholder-class="blur-xl" />
      <div v-else class="w-full aspect-9/8 bg-gray-200 rounded-lg flex items-center justify-center">
        <span class="text-gray-500 text-sm">No Image Available</span>
      </div>
    </NuxtLink>
    <div v-else class="cursor-default">
      <NuxtImg
        v-if="imagetoDisplay"
        :width="imgWidth"
        :height="imgHeight"
        :src="imagetoDisplay"
        :alt="node.image?.altText || node.name || 'Product image'"
        :title="node.image?.title || node.name"
        :loading="index <= 3 ? 'eager' : 'lazy'"
        :sizes="`sm:${imgWidth / 2}px md:${imgWidth}px`"
        class="rounded-lg object-top object-cover w-full aspect-9/8"
        placeholder
        placeholder-class="blur-xl" />
      <div v-else class="w-full aspect-9/8 bg-gray-200 rounded-lg flex items-center justify-center">
        <span class="text-gray-500 text-sm">No Image Available</span>
      </div>
    </div>
    <div class="p-2">
      <StarRating v-if="storeSettings.showReviews" :rating="node.averageRating || 0" :count="node.reviewCount || 0" />
      <NuxtLink v-if="node.slug" :to="getProductUrl(decodeURIComponent(node.slug))" :title="node.name">
        <h2 class="mb-2 font-light leading-tight group-hover:text-primary">{{ node.name }}</h2>
      </NuxtLink>
      <h2 v-else class="mb-2 font-light leading-tight text-gray-600">{{ node.name }}</h2>
      <ProductPrice class="text-sm" :sale-price="node.salePrice" :regular-price="node.regularPrice" />
    </div>
  </div>
</template>
