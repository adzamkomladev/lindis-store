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
      <h1 class="font-headline font-black text-[#000622] text-3xl mb-2">Wishlist</h1>
      <p class="text-sm text-[#757681] font-body">Products you've saved for later.</p>
    </div>

    <div v-if="items?.length" class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div
        v-for="item in items"
        :key="item.id"
        class="bg-white border border-[#c5c6d1]/20 p-4 flex gap-4"
      >
        <NuxtLink :to="`/products/${item.slug}`" class="w-24 h-24 bg-[#f3f4f5] shrink-0 overflow-hidden">
          <img v-if="item.images?.[0]" :src="`/images/${item.images[0]}`" class="w-full h-full object-cover" />
          <Package v-else class="w-8 h-8 text-[#c5c6d1] m-8" />
        </NuxtLink>
        <div class="flex-1 min-w-0">
          <NuxtLink :to="`/products/${item.slug}`" class="font-body font-bold text-sm text-[#000622] hover:text-primary transition-colors line-clamp-1">
            {{ item.name }}
          </NuxtLink>
          <p class="text-xs text-[#757681] font-body mt-1 uppercase tracking-wide">{{ item.category }}</p>
          <p class="font-body font-bold text-sm text-[#000622] mt-2">{{ formatPrice(item.price) }}</p>
          <div class="flex items-center gap-3 mt-3">
            <NuxtLink :to="`/products/${item.slug}`" class="text-xs font-bold uppercase tracking-widest font-label text-[#475d92] hover:text-[#000622] transition-colors">
              View Product
            </NuxtLink>
            <button @click="remove(item.productId)" class="text-xs font-bold uppercase tracking-widest font-label text-red-600 hover:text-red-700 transition-colors flex items-center gap-1">
              <Trash2 class="w-3 h-3" /> Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-white border border-[#c5c6d1]/20 p-12 text-center">
      <Heart class="w-10 h-10 text-[#c5c6d1] mx-auto mb-4" />
      <h3 class="font-headline font-bold text-xl text-[#000622] mb-2">Your wishlist is empty</h3>
      <p class="text-sm text-[#757681] font-body mb-6">Save items you love and come back to them anytime.</p>
      <NuxtLink to="/products" class="inline-block px-6 py-3 bg-[#000622] text-white font-label font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity">
        Explore Products
      </NuxtLink>
    </div>
  </div>
</template>
