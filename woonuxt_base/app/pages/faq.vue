<template>
  <div class="container my-8">
    <header class="mb-12 text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        Find answers to common questions about CatalogHub. Can't find what you're looking for? 
        <a href="mailto:cataloghub.in@gmail.com" class="text-primary hover:underline">Contact our support team</a>.
      </p>
    </header>

    <div class="max-w-4xl mx-auto">
      <div class="space-y-4">
        <!-- FAQ Item 1 -->
        <div class="bg-white rounded-lg shadow-md border border-gray-200">
          <button 
            @click="toggleFaq(0)"
            class="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            :class="{ 'bg-gray-50': openFaq === 0 }"
          >
            <h3 class="text-lg font-semibold text-gray-900">How much does CatalogHub cost?</h3>
            <Icon 
              name="ion:chevron-down-outline" 
              size="20" 
              class="text-gray-500 transition-transform duration-200"
              :class="{ 'rotate-180': openFaq === 0 }"
            />
          </button>
          <Transition name="slide-down">
            <div v-if="openFaq === 0" class="px-6 pb-4">
              <p class="text-gray-700 leading-relaxed">
                First month free, then 1% per order. No subscription fees!
              </p>
            </div>
          </Transition>
        </div>

        <!-- FAQ Item 2 -->
        <div class="bg-white rounded-lg shadow-md border border-gray-200">
          <button 
            @click="toggleFaq(1)"
            class="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            :class="{ 'bg-gray-50': openFaq === 1 }"
          >
            <h3 class="text-lg font-semibold text-gray-900">Is there a contract?</h3>
            <Icon 
              name="ion:chevron-down-outline" 
              size="20" 
              class="text-gray-500 transition-transform duration-200"
              :class="{ 'rotate-180': openFaq === 1 }"
            />
          </button>
          <Transition name="slide-down">
            <div v-if="openFaq === 1" class="px-6 pb-4">
              <p class="text-gray-700 leading-relaxed">
                No – cancel anytime.
              </p>
            </div>
          </Transition>
        </div>

        <!-- FAQ Item 3 -->
        <div class="bg-white rounded-lg shadow-md border border-gray-200">
          <button 
            @click="toggleFaq(2)"
            class="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            :class="{ 'bg-gray-50': openFaq === 2 }"
          >
            <h3 class="text-lg font-semibold text-gray-900">How long does it take to create a catalog?</h3>
            <Icon 
              name="ion:chevron-down-outline" 
              size="20" 
              class="text-gray-500 transition-transform duration-200"
              :class="{ 'rotate-180': openFaq === 2 }"
            />
          </button>
          <Transition name="slide-down">
            <div v-if="openFaq === 2" class="px-6 pb-4">
              <p class="text-gray-700 leading-relaxed">
                Most catalogs are ready within minutes after uploading your video.
              </p>
            </div>
          </Transition>
        </div>

        <!-- FAQ Item 4 -->
        <div class="bg-white rounded-lg shadow-md border border-gray-200">
          <button 
            @click="toggleFaq(3)"
            class="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            :class="{ 'bg-gray-50': openFaq === 3 }"
          >
            <h3 class="text-lg font-semibold text-gray-900">Can I customize my catalog design?</h3>
            <Icon 
              name="ion:chevron-down-outline" 
              size="20" 
              class="text-gray-500 transition-transform duration-200"
              :class="{ 'rotate-180': openFaq === 3 }"
            />
          </button>
          <Transition name="slide-down">
            <div v-if="openFaq === 3" class="px-6 pb-4">
              <p class="text-gray-700 leading-relaxed">
                Yes, you can customize colors, product descriptions, and pricing to match your brand.
              </p>
            </div>
          </Transition>
        </div>

        <!-- FAQ Item 5 -->
        <div class="bg-white rounded-lg shadow-md border border-gray-200">
          <button 
            @click="toggleFaq(4)"
            class="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            :class="{ 'bg-gray-50': openFaq === 4 }"
          >
            <h3 class="text-lg font-semibold text-gray-900">Do you handle shipping and logistics?</h3>
            <Icon 
              name="ion:chevron-down-outline" 
              size="20" 
              class="text-gray-500 transition-transform duration-200"
              :class="{ 'rotate-180': openFaq === 4 }"
            />
          </button>
          <Transition name="slide-down">
            <div v-if="openFaq === 4" class="px-6 pb-4">
              <p class="text-gray-700 leading-relaxed">
                No, we focus on making the selling process easy. You'll still handle product shipping and fulfillment.
              </p>
            </div>
          </Transition>
        </div>

        <!-- FAQ Item 6 -->
        <div class="bg-white rounded-lg shadow-md border border-gray-200">
          <button 
            @click="toggleFaq(5)"
            class="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            :class="{ 'bg-gray-50': openFaq === 5 }"
          >
            <h3 class="text-lg font-semibold text-gray-900">Can I integrate with other platforms?</h3>
            <Icon 
              name="ion:chevron-down-outline" 
              size="20" 
              class="text-gray-500 transition-transform duration-200"
              :class="{ 'rotate-180': openFaq === 5 }"
            />
          </button>
          <Transition name="slide-down">
            <div v-if="openFaq === 5" class="px-6 pb-4">
              <p class="text-gray-700 leading-relaxed">
                Currently, you can share your catalog link on any platform. Direct integrations with major social platforms are coming soon.
              </p>
            </div>
          </Transition>
        </div>

        <!-- FAQ Item 7 -->
        <div class="bg-white rounded-lg shadow-md border border-gray-200">
          <button 
            @click="toggleFaq(6)"
            class="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            :class="{ 'bg-gray-50': openFaq === 6 }"
          >
            <h3 class="text-lg font-semibold text-gray-900">What payment methods do you support?</h3>
            <Icon 
              name="ion:chevron-down-outline" 
              size="20" 
              class="text-gray-500 transition-transform duration-200"
              :class="{ 'rotate-180': openFaq === 6 }"
            />
          </button>
          <Transition name="slide-down">
            <div v-if="openFaq === 6" class="px-6 pb-4">
              <p class="text-gray-700 leading-relaxed">
                We currently support all UPI payment apps including Google Pay, PhonePe, Paytm, and others.
              </p>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Call to Action -->
      <div class="mt-12 bg-gradient-to-r from-primary/5 to-orange-500/5 rounded-lg p-8 text-center">
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Still have questions?</h2>
        <p class="text-gray-600 mb-6">
          Our support team is here to help you get the most out of CatalogHub.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="mailto:cataloghub.in@gmail.com"
            class="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Icon name="ion:mail-outline" size="20" class="mr-2" />
            Contact Support
          </a>
          <NuxtLink 
            to="/"
            class="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Icon name="ion:home-outline" size="20" class="mr-2" />
            Back to Home
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Define page meta
definePageMeta({
  name: 'faq'
})

// FAQ state management
const openFaq = ref<number | null>(null)

const toggleFaq = (index: number) => {
  openFaq.value = openFaq.value === index ? null : index
}

// SEO meta
useSeoMeta({
  title: 'FAQ - Frequently Asked Questions | CatalogHub',
  description: 'Find answers to common questions about CatalogHub pricing, features, customization, and more. Get help with your online catalog creation.',
  ogTitle: 'CatalogHub FAQ - Your Questions Answered',
  ogDescription: 'Get answers to frequently asked questions about CatalogHub - pricing, features, customization, and platform integrations.',
})
</script>

<style scoped>
.text-primary {
  color: #ff5733;
}

.bg-primary {
  background-color: #ff5733;
}

.hover\:bg-primary\/90:hover {
  background-color: rgb(255 87 51 / 0.9);
}

.from-primary\/5 {
  --tw-gradient-from: rgb(255 87 51 / 0.05) var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(255 87 51 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

/* Slide down animation */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from {
  max-height: 0;
  opacity: 0;
}

.slide-down-enter-to {
  max-height: 200px;
  opacity: 1;
}

.slide-down-leave-from {
  max-height: 200px;
  opacity: 1;
}

.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}
</style> 