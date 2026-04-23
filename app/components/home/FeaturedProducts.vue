<script setup lang="ts">
import type { Product } from '~/types/cart'

const props = defineProps<{
  title: string
  subtitle?: string
  products: Product[]
  viewAllLink?: string
  categories?: string[]
}>()

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS'
  }).format(amount / 100)
}

// For bento: first product is featured full-width, rest go in the side column
const featuredProduct = computed(() => props.products?.[0])
const sideProducts = computed(() => props.products?.slice(1, 3) ?? [])
</script>

<template>
  <section class="py-20 lg:py-24 bg-background">
    <div class="max-w-screen-2xl mx-auto">
      <div class="text-center mb-16">
        <span class="text-secondary font-label font-bold uppercase tracking-widest text-[10px] mb-2 block">Selections</span>
        <h2 class="font-headline font-medium italic text-4xl text-on-surface">Featured Products</h2>
      </div>

      <div v-if="products?.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div v-for="product in products.slice(0, 3)" :key="product.id" class="group bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/10">
          <!-- Image -->
          <NuxtLink :to="`/products/${product.slug}`" class="block aspect-square overflow-hidden bg-surface-container-low rounded-lg mb-6 relative">
            <NuxtImg
              v-if="product.images?.length"
              :src="`/images/${product.images[0]}`"
              :alt="product.name"
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-outline-variant">
              <span class="material-symbols-outlined text-5xl">inventory_2</span>
            </div>
            <div v-if="product.stock === 0" class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-on-surface tracking-widest uppercase">
              Sold Out
            </div>
          </NuxtLink>

          <!-- Details -->
          <div class="px-2 pb-2">
            <div class="flex justify-between items-start mb-2">
              <NuxtLink :to="`/products/${product.slug}`">
                <h3 class="font-headline font-medium text-lg text-on-surface hover:text-primary transition-colors">{{ product.name }}</h3>
              </NuxtLink>
              <span class="font-body text-sm font-semibold text-on-surface">{{ formatPrice(product.price) }}</span>
            </div>

            <!-- Reviews mock -->
            <div class="flex items-center gap-2 mb-6">
              <div class="flex text-secondary gap-0.5 text-xs">
                ★ ★ ★ ★ ★
              </div>
              <span class="text-[10px] text-on-surface-variant font-body">(12 reviews)</span>
            </div>

            <!-- Add to Cart -->
            <button class="w-full py-3 rounded-md border border-outline-variant/30 text-on-surface font-label uppercase text-[10px] font-bold tracking-widest hover:bg-surface-container transition-colors">
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20 bg-surface-container-lowest rounded-xl border border-outline-variant/10">
        <span class="material-symbols-outlined text-5xl text-outline-variant mb-4 block">inventory_2</span>
        <p class="font-headline text-on-surface text-xl mb-2">Coming Soon</p>
        <p class="text-on-surface-variant font-body text-sm">Our featured collection is being assembled.</p>
      </div>
    </div>
  </section>
</template>
