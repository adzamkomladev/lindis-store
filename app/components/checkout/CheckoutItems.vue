<script setup lang="ts">
import type { CartItem } from '~/types/cart'

defineProps<{
  items: CartItem[]
}>()

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS'
  }).format(amount / 100)
}
</script>

<template>
  <div class="space-y-2 md:space-y-3 max-h-52 md:max-h-80 overflow-auto pr-1 md:pr-2 -mr-1 md:-mr-2">
    <div 
      v-for="item in items" 
      :key="item.id" 
      class="flex gap-2.5 md:gap-4 p-2 md:p-3 bg-surface-container-low md:bg-surface-container-lowest rounded-lg md:rounded-xl border border-outline-variant"
    >
      <div class="h-12 w-12 md:h-16 md:w-16 bg-surface-container-low md:bg-surface-container-low rounded-md md:rounded-lg border border-outline-variant overflow-hidden shrink-0">
        <NuxtImg 
          v-if="item.image"
          :src="item.image" 
          :alt="item.name"
          class="h-full w-full object-contain mix-blend-multiply" 
        />
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-medium text-xs md:text-sm text-on-surface truncate">{{ item.name }}</p>
        <p class="text-xs text-on-surface-variant">Qty: {{ item.quantity }}</p>
      </div>
      <p class="font-semibold text-xs md:text-sm text-on-surface whitespace-nowrap self-center">
        {{ formatPrice(item.price * item.quantity) }}
      </p>
    </div>
  </div>
</template>
