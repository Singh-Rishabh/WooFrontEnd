<template>
  <div class="container my-8">
    <div v-if="!currentStore" class="text-center py-8">
      <p class="text-gray-600">Loading store information...</p>
    </div>
    
    <template v-else>
      <header class="mb-8">
        <h1 class="text-3xl font-semibold text-primary mb-2">Contact {{ currentStore.site_name }}</h1>
        <p class="text-lg text-gray-600">Get in touch with us for any inquiries or support</p>
      </header>

      <div class="grid gap-8 md:grid-cols-2">
        <!-- Store Information -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-semibold mb-4 text-gray-800">Store Information</h2>
          
          <div class="space-y-4">
            <div class="flex items-start space-x-3">
              <Icon name="ion:storefront-outline" class="text-primary mt-1" size="20" />
              <div>
                <h3 class="font-semibold text-gray-700">Store Name</h3>
                <p class="text-gray-600">{{ currentStore.site_name }}</p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <Icon name="ion:mail-outline" class="text-primary mt-1" size="20" />
              <div>
                <h3 class="font-semibold text-gray-700">Email Address</h3>
                <a 
                  :href="`mailto:${currentStore.admin_email}`" 
                  class="text-primary hover:underline"
                >
                  {{ currentStore.admin_email }}
                </a>
              </div>
            </div>

            <!-- <div class="flex items-start space-x-3">
              <Icon name="ion:globe-outline" class="text-primary mt-1" size="20" />
              <div>
                <h3 class="font-semibold text-gray-700">Website</h3>
                <a 
                  :href="currentStore.site_url" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="text-primary hover:underline"
                >
                  {{ currentStore.site_url }}
                </a>
              </div>
            </div> -->

            <div class="flex items-start space-x-3">
              <Icon name="ion:language-outline" class="text-primary mt-1" size="20" />
              <div>
                <h3 class="font-semibold text-gray-700">Language</h3>
                <p class="text-gray-600">{{ currentStore.language || 'English' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Methods -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-semibold mb-4 text-gray-800">Contact Methods</h2>
          
          <div class="space-y-6">
            <!-- Phone Support Coming Soon -->
            <div class="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded-r-lg">
              <div class="flex items-center space-x-3">
                <Icon name="ion:call-outline" class="text-yellow-600" size="20" />
                <div>
                  <h3 class="font-semibold text-yellow-800">Phone Support</h3>
                  <p class="text-yellow-700 text-sm">Coming Soon - Call Support</p>
                  <p class="text-yellow-600 text-xs mt-1">We're working on adding phone support for better customer service</p>
                </div>
              </div>
            </div>

            <!-- General Support -->
            <div class="border-l-4 border-blue-400 bg-blue-50 p-4 rounded-r-lg">
              <div class="flex items-center space-x-3">
                <Icon name="ion:help-circle-outline" class="text-blue-600" size="20" />
                <div>
                  <h3 class="font-semibold text-blue-800">General Support</h3>
                  <p class="text-blue-700 text-sm">For platform-related inquiries</p>
                  <a 
                    href="mailto:cataloghub.in@gmail.com" 
                    class="text-blue-600 hover:underline text-sm"
                  >
                    cataloghub.in@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <!-- Business Hours -->
            <div class="border-l-4 border-green-400 bg-green-50 p-4 rounded-r-lg">
              <div class="flex items-center space-x-3">
                <Icon name="ion:time-outline" class="text-green-600" size="20" />
                <div>
                  <h3 class="font-semibold text-green-800">Business Hours</h3>
                  <p class="text-green-700 text-sm">Monday - Saturday: 9:00 AM - 6:00 PM</p>
                  <p class="text-green-600 text-xs">We typically respond within 24 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Information -->
      <div class="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-3 text-gray-800">How Can We Help?</h2>
        <div class="prose text-gray-600">
          <p>
            Whether you have questions about our products, need assistance with your order, or want to learn more about {{ currentStore.site_name }}, 
            we're here to help. Our team is committed to providing you with the best possible service and support.
          </p>
          <p>
            For store-specific inquiries, please use the store email address above. For general platform support, technical issues, 
            or questions about Cataloghub, feel free to reach out to our support team.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStoreManager, getStoreSlugFromUrl } from '../../../composables/useStoreManager'

// Define page meta
definePageMeta({
  name: 'store-slug-contact'
})

const route = useRoute()
const router = useRouter()

// Get the store slug from the route
const storeSlug = computed(() => route.params.slug as string)

// Store manager setup
const { stores, currentStore, loading, error, fetchStores, setCurrentStore } = useStoreManager()

// Initialize store
onMounted(async () => {
  try {
    if (!currentStore.value) {
      // If stores aren't loaded, fetch them first
      if (!stores.value.length) {
        await fetchStores()
      }
      
      // Find the store by slug
      const store = stores.value.find((s: any) => 
        getStoreSlugFromUrl(s.site_url) === storeSlug.value
      )
      
      if (store) {
        await setCurrentStore(store)
      } else {
        console.error('Store not found for slug:', storeSlug.value)
        router.push('/')
      }
    }
  } catch (err) {
    console.error('Error initializing store for contact page:', err)
  }
})

// Update SEO meta
useSeoMeta({
  title: `Contact ${currentStore.value?.site_name || 'Store'} - Cataloghub`,
  description: `Get in touch with ${currentStore.value?.site_name || 'our store'} for product inquiries, support, and more information.`,
})
</script>

<style scoped>
.text-primary {
  color: #ff5733;
}

.border-primary {
  border-color: #ff5733;
}

.bg-primary {
  background-color: #ff5733;
}

.hover\:bg-primary:hover {
  background-color: #e64a2e;
}
</style> 