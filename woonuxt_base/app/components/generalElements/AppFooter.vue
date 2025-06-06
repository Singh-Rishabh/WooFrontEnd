<script setup lang="ts">
const { wooNuxtVersionInfo } = useHelpers();
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
  <footer class="bg-white order-last">
    <div class="container flex flex-wrap justify-between gap-12 my-24 md:gap-24">
      <div class="mr-auto">
        <Logo />
        <WebsiteShortDescription />
        <LangSwitcher class="mt-8" />
      </div>
      
      <!-- Store-specific footer content -->
      <template v-if="isInStoreContext">
        <div class="w-3/7 lg:w-auto">
          <div class="mb-1 font-semibold">Products</div>
          <div class="text-sm">
            <NuxtLink :to="getStoreAwareUrl('/products')" class="py-1.5 block">{{ $t('messages.shop.newArrivals') }}</NuxtLink>
            <NuxtLink :to="getStoreAwareUrl('/products?filter=sale[true]')" class="py-1.5 block">On sale</NuxtLink>
            <NuxtLink :to="getStoreAwareUrl('/products?orderby=rating&order=ASC&filter=rating[1]')" class="py-1.5 block">Top rated</NuxtLink>
          </div>
        </div>
        <div class="w-3/7 lg:w-auto">
          <div class="mb-1 font-semibold">{{ $t('messages.general.customerService') }}</div>
          <div class="text-sm">
            <NuxtLink :to="getStoreAwareUrl('/contact')" class="py-1.5 block">Contact Us</NuxtLink>
            <a href="/" class="py-1.5 block">Shipping & Returns</a>
            <a href="/" class="py-1.5 block">Privacy Policy</a>
            <a href="/" class="py-1.5 block">Terms & Conditions</a>
          </div>
        </div>
        <div class="w-3/7 lg:w-auto">
          <div class="mb-1 font-semibold">{{ $t('messages.account.myAccount') }}</div>
          <div class="text-sm">
            <NuxtLink to="/my-account/" class="py-1.5 block">{{ $t('messages.account.myAccount') }}</NuxtLink>
            <NuxtLink to="/my-account/?tab=orders" class="py-1.5 block">{{ $t('messages.shop.orderHistory') }}</NuxtLink>
            <NuxtLink :to="wishlistLink" class="py-1.5 block">{{ $t('messages.shop.wishlist') }}</NuxtLink>
          </div>
        </div>
      </template>
      
      <!-- Global home page footer content -->
      <template v-else>
        <div class="w-3/7 lg:w-auto">
          <div class="mb-1 font-semibold">Platform</div>
          <div class="text-sm">
            <a href="https://cataloghub.in" class="py-1.5 block">About Cataloghub</a>
            <a href="/faq" class="py-1.5 block">FAQ's</a>
          </div>
        </div>
        <div class="w-3/7 lg:w-auto">
          <div class="mb-1 font-semibold">Support</div>
          <div class="text-sm">
            <a href="mailto:cataloghub.in@gmail.com" class="py-1.5 block">Contact Support</a>
            <a href="/" class="py-1.5 block">Terms & Conditions</a>
            <a href="/" class="py-1.5 block">Privacy Policy</a>
          </div>
        </div>
        <div class="w-3/7 lg:w-auto">
          <div class="mb-1 font-semibold">{{ $t('messages.account.myAccount') }}</div>
          <div class="text-sm">
            <NuxtLink to="/my-account/" class="py-1.5 block">{{ $t('messages.account.myAccount') }}</NuxtLink>
            <NuxtLink to="/my-account/?tab=orders" class="py-1.5 block">{{ $t('messages.shop.orderHistory') }}</NuxtLink>
          </div>
        </div>
      </template>
    </div>
    <div class="container border-t flex items-center justify-center mb-4">
      <div class="copywrite">
        <p class="py-4 text-xs text-center">
          <a href="https://woonuxt.com" :title="`WooNuxt v${wooNuxtVersionInfo}`">{{ `WooNuxt v${wooNuxtVersionInfo}` }}</a> - by
          <a href="https://scottyzen.com" title="Scott Kennedy - Web Developer" target="_blank">Scott Kennedy</a>
        </p>
      </div>
      <SocialIcons class="ml-auto" />
    </div>
  </footer>
</template>

<style scoped lang="postcss">
a {
  @apply hover:underline;
}
</style>
