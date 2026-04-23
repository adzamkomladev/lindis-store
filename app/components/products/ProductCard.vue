<script setup lang="ts">
import type { Product } from '~/types/cart'

defineProps<{
  product: Product
}>()

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS'
  }).format(amount / 100)
}
</script>

<template>
  <article 
    class="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-stone-100 transition-all duration-500 hover:shadow-xl hover:shadow-stone-200/50 hover:-translate-y-0.5"
  >
    <!-- Image Container -->
    <NuxtLink :to="`/products/${product.slug}`" class="relative aspect-square overflow-hidden bg-stone-50">
      <NuxtImg
        v-if="product.images && product.images.length"
        :src="`/images/${product.images[0]}`"
        :alt="product.name"
        class="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
      />
      <div v-else class="h-full w-full flex items-center justify-center">
        <span class="text-stone-300 text-sm">No Image</span>
      </div>
      
      <!-- Subtle Overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-stone-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </NuxtLink>
    
    <!-- Content -->
    <div class="flex flex-col gap-3 p-5">
      <div class="flex items-start justify-between gap-3">
        <h3 class="font-semibold text-stone-900 group-hover:text-stone-700 transition-colors line-clamp-1">
          <NuxtLink :to="`/products/${product.slug}`">
            {{ product.name }}
          </NuxtLink>
        </h3>
      </div>
      <p v-if="product.description" class="text-sm text-stone-500 line-clamp-2 leading-relaxed">
        {{ product.description }}
      </p>
      <div class="flex items-center justify-between pt-2 border-t border-stone-50">
        <span class="text-lg font-bold text-stone-900">{{ formatPrice(product.price) }}</span>
        <span class="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
          In Stock
        </span>
      </div>
    </div>
  </article>
</template>
