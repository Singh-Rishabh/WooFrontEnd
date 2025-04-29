<script setup lang="ts">
import { useStoreService } from '../services/storeService';

const props = defineProps({
  query: { type: String, required: true },
  variables: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['loading', 'success', 'error']);

// Get the store service and current client
const { selectedStore, getCurrentGraphQLClient } = useStoreService();

// Create reactive refs for query state
const loading = ref(true);
const error = ref<any>(null);
const data = ref<any>(null);

// Watch for store changes to re-run the query
watch(selectedStore, () => {
  executeQuery();
}, { immediate: true });

// Function to execute the query
const executeQuery = async () => {
  loading.value = true;
  error.value = null;
  emit('loading', true);
  
  try {
    // Get the current client
    const client = getCurrentGraphQLClient();
    
    if (!client) {
      throw new Error('No GraphQL client available. Please select a store first.');
    }
    
    // Execute the query
    console.log(`Executing query with store ${selectedStore.value?.name} (${selectedStore.value?.graphqlEndpoint}):`, props.query);
    const result = await client(selectedStore.value?.graphqlEndpoint, {
      query: props.query,
      variables: props.variables
    });
    
    // Update the data
    data.value = result.data;
    emit('success', result.data);
  } catch (err) {
    console.error('Error executing query:', err);
    error.value = err;
    emit('error', err);
  } finally {
    loading.value = false;
    emit('loading', false);
  }
};

// Execute the query on mount
onMounted(() => {
  executeQuery();
});

// Expose the data, loading, and error states
defineExpose({
  loading,
  error,
  data,
  executeQuery
});
</script>

<template>
  <slot
    :data="data"
    :loading="loading"
    :error="error"
    :refresh="executeQuery"
  />
</template> 