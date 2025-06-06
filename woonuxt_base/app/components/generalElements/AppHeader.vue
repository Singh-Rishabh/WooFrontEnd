<script setup lang="ts">
const { isShowingSearch } = useSearching();
const route = useRoute();

// Check if we're in a store context
const isInStoreContext = computed(() => route.name?.toString().startsWith('store-'));

// Get current store information for mobile display
const { currentStore } = useStoreManager();
</script>

<template>
  <header class="sticky top-0 z-40 bg-white shadow-sm shadow-light-500">
    <div class="container flex items-center justify-between py-4">
      <div class="flex items-center">
        <MenuTrigger v-if="isInStoreContext" class="lg:hidden" />
        <Logo class="md:w-[160px]" />
        
        <!-- Store Name for Mobile - Only visible in store context and on mobile -->
        <div v-if="isInStoreContext && currentStore" class="ml-3 lg:hidden">
          <div class="text-md font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[180px]">
            {{ currentStore.site_name }}
          </div>
        </div>
      </div>
      
      <!-- Only show MainMenu when in store context -->
      <MainMenu v-if="isInStoreContext" class="items-center hidden gap-6 text-sm text-gray-500 lg:flex lg:px-4" />
      
      <div class="flex justify-end items-center md:w-[160px] flex-1 ml-auto gap-4 md:gap-6">
        <ProductSearch v-if="isInStoreContext" class="hidden sm:inline-flex max-w-[320px] w-[60%]" />
        <SearchTrigger v-if="isInStoreContext" />
        <div class="flex gap-4 items-center">
          <SignInLink />
          <CartTrigger v-if="isInStoreContext" />
        </div>
      </div>
    </div>
    <Transition name="scale-y" mode="out-in">
      <div class="container mb-3 -mt-1 sm:hidden" v-if="isShowingSearch && isInStoreContext">
        <ProductSearch class="flex w-full" />
      </div>
    </Transition>
  </header>
</template>
