<template>
  <div>
    <h1>Test Page</h1>
    <p>This is a test page to verify routing works.</p>
    <button @click="goBack">Go Back</button>
  </div>
</template>

<script setup>
console.log('🧪 Test page loaded successfully!')

const router = useRouter()

const goBack = () => {
  console.log('🔙 Going back...')
  router.back()
}
</script> 