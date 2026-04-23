<script setup lang="ts">
// Cart page — editorial layout
import CartItem from '@/components/cart/CartItem.vue'
import CartSummary from '@/components/cart/CartSummary.vue'
import CartEmpty from '@/components/cart/CartEmpty.vue'

const { cart, removeFromCart, updateQuantity, cartTotal } = useCart()

// Fetch recommendations for the cart page
const { data: recommendations } = await useFetch('/api/products/featured', { query: { limit: 3 } })

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS'
  }).format(amount / 100)
}

useSeoMeta({
  title: "Shopping Cart | Lindi's Store"
})
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fa]">

    <!-- Editorial Page Header -->
    <section class="pt-40 pb-16 px-8 max-w-screen-2xl mx-auto">
      <span class="text-[#475d92] font-label font-bold uppercase tracking-widest text-xs mb-2 block">Your Selection</span>
      <h1 class="font-headline font-black tracking-tighter text-[#000622] leading-none" style="font-size: clamp(2.5rem, 6vw, 4rem)">
        Shopping Cart
      </h1>
    </section>

    <div class="px-8 max-w-screen-2xl mx-auto pb-24">
      <CartEmpty v-if="cart.items.length === 0" />

      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <!-- Cart Items -->
        <div class="lg:col-span-8">
          <div class="space-y-12">
            <CartItem
              v-for="item in cart.items"
              :key="item.id"
              :item="item"
              @remove="removeFromCart"
              @update-quantity="updateQuantity"
            />
          </div>

          <!-- Continue Shopping -->
          <div class="mt-16">
            <NuxtLink
              to="/products"
              class="inline-flex items-center gap-2 text-[#000622] font-bold uppercase tracking-widest text-sm font-label hover:opacity-70 transition-opacity group"
            >
              <span class="material-symbols-outlined group-hover:-translate-x-1 transition-transform">west</span>
              Continue Shopping
            </NuxtLink>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="lg:col-span-4">
          <CartSummary :subtotal="cartTotal" show-checkout />
        </div>
      </div>

      <!-- Recommendations -->
      <section v-if="recommendations?.length" class="mt-32">
        <h2 class="font-headline font-black text-[#000622] mb-12 tracking-tighter" style="font-size: 1.75rem">
          You might also appreciate
        </h2>
        <!-- Asymmetric bento: large first, 2 regular -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Large card -->
          <NuxtLink
            v-if="recommendations[0]"
            :to="`/products/${recommendations[0].slug}`"
            class="md:col-span-2 bg-[#edeeef] group overflow-hidden relative"
            style="min-height: 400px"
          >
            <NuxtImg
              v-if="recommendations[0].images?.length"
              :src="`/images/${recommendations[0].images[0]}`"
              :alt="recommendations[0].name"
              class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 absolute inset-0"
            />
            <div class="absolute bottom-8 left-8">
              <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-white mb-1 font-label">
                {{ recommendations[0].category || 'Collection' }}
              </p>
              <h3 class="text-white font-headline font-bold text-2xl uppercase tracking-tight">{{ recommendations[0].name }}</h3>
            </div>
          </NuxtLink>

          <!-- Two regular cards -->
          <NuxtLink
            v-for="product in recommendations.slice(1, 3)"
            :key="product.id"
            :to="`/products/${product.slug}`"
            class="aspect-[3/4] bg-[#edeeef] group overflow-hidden"
          >
            <div class="relative h-full">
              <NuxtImg
                v-if="product.images?.length"
                :src="`/images/${product.images[0]}`"
                :alt="product.name"
                class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div class="p-5 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#000622]/60 to-transparent">
                <h3 class="font-headline font-bold text-lg text-white uppercase tracking-tight">{{ product.name }}</h3>
                <p class="text-[#b1c6ff] font-bold text-sm font-label">{{ formatPrice(product.price) }}</p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>
