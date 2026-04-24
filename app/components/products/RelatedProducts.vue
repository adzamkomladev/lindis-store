<script setup lang="ts">
import type { Product } from '~/types/cart'

defineProps<{
  products: Product[]
  title?: string
}>()

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS'
  }).format(amount / 100)
}
</script>

<template>
  <section class="mt-32 pt-12 border-t border-[#c5c6d1]/15">
    <div class="flex justify-between items-end mb-12">
      <div>
        <span class="font-label uppercase text-[#475d92] tracking-[0.2em] text-xs font-bold mb-2 block">Complete The Set</span>
        <h2 class="font-headline font-bold tracking-tight text-[#000622]" style="font-size: 1.75rem">
          {{ title || 'Ecosystem Pairing' }}
        </h2>
      </div>
      <NuxtLink
        to="/products"
        class="text-[#000622] font-bold font-label uppercase text-sm border-b border-[#000622] pb-1 hover:opacity-70 transition-opacity"
      >
        View Collection
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div
        v-for="product in products.slice(0, 3)"
        :key="product.id"
        class="group"
      >
        <NuxtLink :to="`/products/${product.slug}`" class="block">
          <div class="aspect-[3/4] bg-[#edeeef] overflow-hidden mb-6">
            <NuxtImg
              v-if="product.images?.length"
              :src="product.images[0]"
              :alt="product.name"
              class="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-[#c5c6d1]">
              <span class="material-symbols-outlined text-4xl">inventory_2</span>
            </div>
          </div>
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-headline text-lg font-bold text-[#000622] uppercase tracking-tight leading-tight">{{ product.name }}</h3>
              <p class="text-[#757681] text-sm font-label mt-0.5">{{ product.category || 'Collection' }}</p>
            </div>
            <span class="font-headline font-bold text-[#000622]">{{ formatPrice(product.price) }}</span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
