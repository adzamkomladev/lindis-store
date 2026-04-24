<script setup lang="ts">
import type { CartItem } from '~/types/cart'

const props = defineProps<{
  item: CartItem
}>()

const emit = defineEmits<{
  remove: [id: string]
  updateQuantity: [id: string, quantity: number]
}>()

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS'
  }).format(amount / 100)
}
</script>

<template>
  <div class="flex flex-col md:flex-row gap-8 items-start md:items-center group">
    <!-- Product Image -->
    <NuxtLink :to="`/products/${item.slug}`" class="shrink-0 w-full md:w-48">
      <div class="aspect-[3/4] bg-[#f3f4f5] overflow-hidden">
        <NuxtImg
          v-if="item.image"
          :src="item.image"
          :alt="item.name"
          class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-[#c5c6d1]">
          <span class="material-symbols-outlined text-4xl">inventory_2</span>
        </div>
      </div>
    </NuxtLink>

    <!-- Content -->
    <div class="flex-grow space-y-2">
      <div class="flex justify-between items-start gap-4">
        <div>
          <h3 class="font-headline font-bold text-[#000622] uppercase tracking-tight" style="font-size: 1.25rem">
            <NuxtLink :to="`/products/${item.slug}`" class="hover:text-[#475d92] transition-colors">
              {{ item.name }}
            </NuxtLink>
          </h3>
          <p class="text-[#454650] text-sm font-body mt-0.5">{{ item.name }}</p>
        </div>
        <span class="font-headline font-bold text-[#000622] text-xl">{{ formatPrice(item.price) }}</span>
      </div>

      <!-- Eco-chips -->
      <div class="flex items-center gap-2 mt-2">
        <span class="bg-[#adc3fe] text-[#394f83] text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider font-label">Premium Grade</span>
        <span class="bg-[#e1e3e4] text-[#454650] text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider font-label">BPA Free</span>
      </div>

      <!-- Custom Texts -->
      <div v-if="item.customTexts && item.customTexts.length" class="mt-4 space-y-3">
        <div v-for="(_, index) in item.quantity" :key="index" class="flex flex-col">
          <label :for="`custom-text-${item.id}-${index}`" class="text-[10px] font-bold uppercase tracking-widest text-[#757681] mb-1.5 font-label">
            Custom Text <span v-if="item.quantity > 1">(Item {{ index + 1 }})</span>
          </label>
          <input 
            :id="`custom-text-${item.id}-${index}`"
            v-if="item.customTexts[index] !== undefined"
            v-model="item.customTexts[index]"
            type="text"
            maxlength="100"
            placeholder="Add a custom name or message..."
            class="w-full px-3 py-2 text-sm text-[#000622] font-body border border-[#c5c6d1]/60 focus:outline-none focus:border-[#475d92] transition-colors placeholder:text-[#c5c6d1]"
          />
        </div>
      </div>

      <!-- Quantity controls + remove -->
      <div class="flex items-center justify-between pt-5 border-b border-[#c5c6d1]/15 pb-2">
        <!-- Quantity -->
        <div class="flex items-center border border-[#c5c6d1]/40">
          <button
            @click="emit('updateQuantity', item.id, item.quantity - 1)"
            :disabled="item.quantity <= 1"
            class="px-3 py-2 text-[#000622] hover:bg-[#edeeef] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Decrease quantity"
          >
            <span class="material-symbols-outlined text-sm">remove</span>
          </button>
          <span class="px-5 font-bold text-sm font-label text-[#000622]">{{ String(item.quantity).padStart(2, '0') }}</span>
          <button
            @click="emit('updateQuantity', item.id, item.quantity + 1)"
            :disabled="item.quantity >= 99"
            class="px-3 py-2 text-[#000622] hover:bg-[#edeeef] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            <span class="material-symbols-outlined text-sm">add</span>
          </button>
        </div>

        <!-- Item total + Remove -->
        <div class="flex items-center gap-4">
          <span class="text-sm font-bold font-label text-[#000622]">{{ formatPrice(item.price * item.quantity) }}</span>
          <button
            @click="emit('remove', item.id)"
            class="text-xs font-bold uppercase tracking-widest text-[#475d92] hover:text-[#000622] transition-colors flex items-center gap-1 font-label"
            aria-label="Remove item"
          >
            Remove <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
