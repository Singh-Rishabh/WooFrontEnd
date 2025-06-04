<script setup lang="ts">
const { siteName } = useAppConfig();
const runtimeConfig = useRuntimeConfig();
const img = useImage();

// Use CatalogHub logo by default
const catalogHubLogo = '/cataloghub-logo.png';
const customLogo = runtimeConfig?.public?.LOGO;
const logoUrl = (customLogo && typeof customLogo === 'string') ? img(customLogo) : catalogHubLogo;
</script>

<template>
  <NuxtLink to="/" class="inline-flex items-center gap-2">
    <img 
      :src="logoUrl" 
      alt="CatalogHub Logo" 
      class="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200"
    />
    <span class="text-lg font-bold text-gray-900 hidden sm:inline">CatalogHub</span>
  </NuxtLink>
</template>

<style scoped>
/* Ensure the logo is perfectly circular */
img {
  border-radius: 50%;
}

/* Add a subtle hover effect */
.inline-flex:hover img {
  transform: scale(1.05);
  transition: transform 0.2s ease-in-out;
}
</style>
