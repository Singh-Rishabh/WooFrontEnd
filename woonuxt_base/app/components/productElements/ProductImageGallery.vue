<script setup lang="ts">
const { FALLBACK_IMG } = useHelpers();

const props = defineProps({
  mainImage: { type: Object, required: true },
  gallery: { type: Object, required: true },
  node: { type: Object as PropType<Product | Variation>, required: true },
  activeVariation: { type: Object, required: false },
});

const primaryImage = computed(() => ({
  sourceUrl: props.mainImage.sourceUrl || FALLBACK_IMG,
  title: props.mainImage.title,
  altText: props.mainImage.altText,
  databaseId: props.mainImage.databaseId,
}));

const imageToShow = ref(primaryImage.value);

const galleryImages = computed(() => {
  // Add the primary image to the start of the gallery and remove duplicates
  return [primaryImage.value, ...props.gallery.nodes].filter((img, index, self) => index === self.findIndex((t) => t?.databaseId === img?.databaseId));
});

// Current image index for arrow navigation
const currentImageIndex = computed(() => {
  return galleryImages.value.findIndex(img => img.databaseId === imageToShow.value.databaseId);
});

// Navigation functions
const showPreviousImage = () => {
  const currentIndex = currentImageIndex.value;
  const previousIndex = currentIndex > 0 ? currentIndex - 1 : galleryImages.value.length - 1;
  imageToShow.value = galleryImages.value[previousIndex];
};

const showNextImage = () => {
  const currentIndex = currentImageIndex.value;
  const nextIndex = currentIndex < galleryImages.value.length - 1 ? currentIndex + 1 : 0;
  imageToShow.value = galleryImages.value[nextIndex];
};

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (galleryImages.value.length <= 1) return;
  
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    showPreviousImage();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    showNextImage();
  }
};

// Add keyboard event listeners
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

const changeImage = (image: any) => {
  if (image) imageToShow.value = image;
};

watch(
  () => props.activeVariation,
  (newVal) => {
    if (newVal?.image) {
      const foundImage = galleryImages.value.find((img) => img.databaseId === newVal.image?.databaseId);
      if (foundImage) imageToShow.value = foundImage;
    }
  },
);

const imgWidth = 640;
</script>

<template>
  <div>
    <SaleBadge :node class="absolute text-base top-4 right-4 z-10" />
    
    <!-- Main Image Container with Arrow Navigation -->
    <div class="relative group">
      <NuxtImg
        class="rounded-xl object-contain w-full min-w-[350px]"
        :width="imgWidth"
        :height="imgWidth"
        :alt="imageToShow.altText || node.name"
        :title="imageToShow.title || node.name"
        :src="imageToShow.sourceUrl || FALLBACK_IMG"
        fetchpriority="high"
        placeholder
        placeholder-class="blur-xl" />
      
      <!-- Arrow Navigation (only show if there are multiple images) -->
      <div v-if="galleryImages.length > 1" class="absolute inset-0 flex items-center justify-between pointer-events-none">
        <!-- Previous Button -->
        <button
          @click="showPreviousImage"
          class="ml-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 pointer-events-auto opacity-0 group-hover:opacity-100"
          aria-label="Previous image"
          title="Previous image">
          <Icon name="ion:chevron-back-outline" size="24" class="text-gray-700" />
        </button>
        
        <!-- Next Button -->
        <button
          @click="showNextImage"
          class="mr-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 pointer-events-auto opacity-0 group-hover:opacity-100"
          aria-label="Next image"
          title="Next image">
          <Icon name="ion:chevron-forward-outline" size="24" class="text-gray-700" />
        </button>
      </div>
      
      <!-- Image Counter (only show if there are multiple images) -->
      <div v-if="galleryImages.length > 1" class="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
        {{ currentImageIndex + 1 }} / {{ galleryImages.length }}
      </div>
    </div>
    
    <!-- Thumbnail Gallery -->
    <div v-if="gallery.nodes.length" class="my-4 gallery-images">
      <NuxtImg
        v-for="(galleryImg, index) in galleryImages"
        :key="galleryImg.databaseId"
        class="cursor-pointer rounded-xl transition-all duration-200"
        :class="{ 
          'ring-2 ring-primary ring-offset-2 opacity-100': galleryImg.databaseId === imageToShow.databaseId,
          'opacity-70 hover:opacity-100': galleryImg.databaseId !== imageToShow.databaseId
        }"
        :width="imgWidth"
        :height="imgWidth"
        :src="galleryImg.sourceUrl"
        :alt="galleryImg.altText || node.name"
        :title="galleryImg.title || node.name"
        placeholder
        placeholder-class="blur-xl"
        loading="lazy"
        @click.native="changeImage(galleryImg)" />
    </div>
  </div>
</template>

<style scoped>
.gallery-images {
  display: flex;
  overflow: auto;
  gap: 1rem;

  &::-webkit-scrollbar {
    display: none;
  }
}

.gallery-images img {
  width: 72px;
  aspect-ratio: 5/6;
  object-fit: cover;
}

@media (min-width: 768px) {
  .gallery-images {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));

    img {
      width: 100%;
    }
  }
}

/* Arrow button animations */
.group:hover .pointer-events-auto {
  transition: opacity 0.3s ease-in-out;
}

/* Focus styles for better accessibility */
button:focus {
  outline: none;
}
</style>
