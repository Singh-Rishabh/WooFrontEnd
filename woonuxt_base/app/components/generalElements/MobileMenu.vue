<script setup lang="ts">
const { toggleMobileMenu, wooNuxtVersionInfo } = useHelpers();
const route = useRoute();

// Check if we're in a store context
const isInStoreContext = computed(() => route.name?.toString().startsWith('store-'));
</script>

<template>
  <div class="bg-white flex flex-col max-w-lg shadow-lg top-0 bottom-0 left-0 w-11/12 z-50 fixed overflow-x-hidden">
    <CloseIcon class="bg-white rounded-xl shadow-xl p-1.5" @click="toggleMobileMenu(false)" />
    <div class="mt-8 text-center">{{ $t('messages.general.menu') }}</div>
    <!-- Only show MainMenu when in store context -->
    <MainMenu v-if="isInStoreContext" class="m-4 grid p-4 text-gray-500 gap-6" />
    <div v-else class="m-4 p-4 text-center text-gray-500">
      <p class="text-sm">Select a store to access products, categories, and more features.</p>
      <NuxtLink to="/" class="text-primary hover:underline mt-2 block">Browse All Stores</NuxtLink>
    </div>
    <div class="mt-auto text-center p-8 text-[10px] text-gray-400">
      <a href="/" :title="wooNuxtVersionInfo">WooNuxt v{{ wooNuxtVersionInfo }}</a>
    </div>
  </div>
</template>
