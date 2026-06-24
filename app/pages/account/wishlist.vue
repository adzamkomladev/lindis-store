<script setup lang="ts">
import { Package, Heart, Trash2 } from 'lucide-vue-next'

definePageMeta({ layout: 'account' })

const { showSuccess, showError } = useAlertDialog()
const { data: items, refresh } = await useFetch('/api/wishlist')

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount / 100)
}

const remove = async (productId: string) => {
  try {
    await $fetch(`/api/wishlist/${productId}`, { method: 'DELETE' })
    showSuccess('Removed', 'Item removed from wishlist.')
    await refresh()
  } catch (err: any) {
    showError('Error', err.data?.message || 'Failed to remove item')
  }
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="font-headline font-black text-on-surface text-3xl mb-2">Wishlist</h1>
      <p class="text-sm text-on-surface-variant font-body">Products you've saved for later.</p>
    </div>

    <div v-if="items?.length" class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div
        v-for="item in items"
        :key="item.id"
        class="bg-surface-container-lowest border border-outline-variant p-4 flex gap-4"
      >
        <NuxtLink :to="`/products/${item.slug}`" class="w-24 h-24 bg-surface-container-low shrink-0 overflow-hidden">
          <NuxtImg v-if="item.images?.[0]" :src="item.images[0]" class="w-full h-full object-cover" />
          <Package v-else class="w-8 h-8 text-on-surface-variant m-8" />
        </NuxtLink>
        <div class="flex-1 min-w-0">
          <NuxtLink :to="`/products/${item.slug}`" class="font-body font-bold text-sm text-on-surface hover:text-primary transition-colors line-clamp-1">
            {{ item.name }}
          </NuxtLink>
          <p class="text-xs text-on-surface-variant font-body mt-1 uppercase tracking-wide">{{ item.category }}</p>
          <p class="font-body font-bold text-sm text-on-surface mt-2">{{ formatPrice(item.price) }}</p>
          <div class="flex items-center gap-3 mt-3">
            <NuxtLink :to="`/products/${item.slug}`" class="text-xs font-bold uppercase tracking-widest font-label text-primary hover:text-on-surface transition-colors">
              View Product
            </NuxtLink>
            <button @click="remove(item.productId)" class="text-xs font-bold uppercase tracking-widest font-label text-red-600 hover:text-red-700 transition-colors flex items-center gap-1">
              <Trash2 class="w-3 h-3" /> Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-surface-container-lowest border border-outline-variant p-12 text-center">
      <Heart class="w-10 h-10 text-on-surface-variant mx-auto mb-4" />
      <h3 class="font-headline font-bold text-xl text-on-surface mb-2">Your wishlist is empty</h3>
      <p class="text-sm text-on-surface-variant font-body mb-6">Save items you love and come back to them anytime.</p>
      <NuxtLink to="/products" class="inline-block px-6 py-3 bg-primary text-white font-label font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity">
        Explore Products
      </NuxtLink>
    </div>
  </div>
</template>
