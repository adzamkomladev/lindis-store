<script setup lang="ts">
import { Separator } from '@/components/ui/separator'

const props = defineProps<{
  subtotal: number
  showCheckout?: boolean
}>()

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS'
  }).format(amount / 100)
}

// Free shipping threshold: GHS 100
const freeShippingThreshold = 10000
const hasFreeShipping = computed(() => props.subtotal >= freeShippingThreshold)
const remainingForFreeShipping = computed(() => Math.max(0, freeShippingThreshold - props.subtotal))
</script>

<template>
  <div class="bg-[#f3f4f5] p-8 md:p-10 sticky top-32">
    <h2 class="font-headline font-bold text-[#000622] mb-8 tracking-tight" style="font-size: 1.5rem">Order Summary</h2>

    <!-- Free shipping banner -->
    <div v-if="!hasFreeShipping" class="mb-6 text-xs font-label font-bold uppercase tracking-widest text-[#475d92]">
      Add {{ formatPrice(remainingForFreeShipping) }} for free shipping
    </div>
    <div v-else class="mb-6 text-xs font-label font-bold uppercase tracking-widest text-emerald-600">
      ✓ Free shipping unlocked
    </div>

    <!-- Line items -->
    <div class="space-y-5">
      <div class="flex justify-between text-sm font-body">
        <span class="text-[#454650]">Subtotal</span>
        <span class="font-bold text-[#000622]">{{ formatPrice(subtotal) }}</span>
      </div>
      <div class="flex justify-between text-sm font-body">
        <span class="text-[#454650]">Estimated Shipping</span>
        <span class="font-bold text-[#000622]">{{ hasFreeShipping ? 'FREE' : formatPrice(1500) }}</span>
      </div>
      <div class="flex justify-between text-sm font-body">
        <span class="text-[#454650]">Tax</span>
        <span class="font-bold text-[#000622]">{{ formatPrice(0) }}</span>
      </div>

      <!-- Divider + Total -->
      <div class="pt-5 border-t border-[#c5c6d1]/30 flex justify-between items-end">
        <span class="font-headline font-bold text-[#000622] text-lg">Total</span>
        <div class="text-right">
          <span class="block text-[10px] text-[#454650] uppercase font-bold tracking-widest font-label">GHS</span>
          <span class="font-headline font-black text-[#000622] tracking-tighter" style="font-size: 2rem">
            {{ formatPrice(subtotal) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Checkout Button -->
    <div v-if="showCheckout" class="pt-6">
      <NuxtLink
        to="/checkout"
        class="w-full monolith-gradient text-white py-5 font-label font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
      >
        Proceed to Checkout
        <span class="material-symbols-outlined text-lg">arrow_forward</span>
      </NuxtLink>
    </div>

    <slot />

    <!-- Trust badges -->
    <div class="mt-8 space-y-4">
      <div class="flex items-start gap-3">
        <span class="material-symbols-outlined text-[#475d92] text-xl">verified</span>
        <p class="text-[11px] leading-relaxed text-[#454650] font-body">Engineered for endurance. Every Effero product comes with a lifetime performance guarantee.</p>
      </div>
      <div class="flex items-start gap-3">
        <span class="material-symbols-outlined text-[#475d92] text-xl">local_shipping</span>
        <p class="text-[11px] leading-relaxed text-[#454650] font-body">Free delivery in Ghana. Secure nationwide logistics.</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="material-symbols-outlined text-[#475d92] text-xl">lock</span>
        <div class="flex items-center gap-2">
          <NuxtImg src="/img/paystack-logo.png" alt="Paystack" class="h-5 w-auto" />
        </div>
      </div>
    </div>
  </div>
</template>
