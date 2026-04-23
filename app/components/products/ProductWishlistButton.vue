<script setup lang="ts">
const props = defineProps<{
  productId: string
}>()

const { isCustomer, loggedIn } = useAuth()
const { showError } = useAlertDialog()
const inWishlist = ref(false)
const isLoading = ref(false)

// Check if in wishlist on mount
onMounted(async () => {
  if (!isCustomer.value || !loggedIn.value) return
  try {
    const items = await $fetch('/api/wishlist')
    inWishlist.value = items.some((item: any) => item.productId === props.productId)
  } catch {
    // silently fail
  }
})

const toggle = async () => {
  if (!isCustomer.value || !loggedIn.value) {
    navigateTo('/login')
    return
  }
  isLoading.value = true
  try {
    if (inWishlist.value) {
      await $fetch(`/api/wishlist/${props.productId}`, { method: 'DELETE' })
      inWishlist.value = false
    } else {
      await $fetch('/api/wishlist', {
        method: 'POST',
        body: { productId: props.productId },
      })
      inWishlist.value = true
    }
  } catch (err: any) {
    showError('Error', err.data?.message || 'Something went wrong')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <button
    @click="toggle"
    :disabled="isLoading"
    class="p-2 rounded-full transition-colors"
    :class="inWishlist ? 'bg-red-50 text-red-500' : 'bg-white/90 text-on-surface-variant hover:text-red-500'"
    :aria-label="inWishlist ? 'Remove from wishlist' : 'Add to wishlist'"
  >
    <svg v-if="inWishlist" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
    <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
  </button>
</template>
