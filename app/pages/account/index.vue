<script setup lang="ts">
import { Package, MapPin, Heart, ArrowRight } from 'lucide-vue-next'

definePageMeta({ layout: 'account' })

const { data: orders } = await useFetch('/api/account/orders')
const { data: addresses } = await useFetch('/api/account/addresses')

const recentOrders = computed(() => (orders.value || []).slice(0, 3))

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount / 100)
}

const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date))
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="font-headline font-black text-on-surface text-3xl mb-2">Account Overview</h1>
      <p class="text-sm text-on-surface-variant font-body">Manage your orders, addresses, and preferences.</p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-surface-container-lowest border border-outline-variant p-6">
        <div class="flex items-center gap-3 mb-3">
          <div class="p-2 bg-[#adc3fe]"><Package class="w-4 h-4 text-primary" /></div>
          <span class="text-xs font-bold uppercase tracking-widest font-label text-on-surface-variant">Orders</span>
        </div>
        <p class="font-headline font-bold text-3xl text-on-surface">{{ orders?.length || 0 }}</p>
      </div>
      <div class="bg-surface-container-lowest border border-outline-variant p-6">
        <div class="flex items-center gap-3 mb-3">
          <div class="p-2 bg-violet-500/10"><MapPin class="w-4 h-4 text-violet-600" /></div>
          <span class="text-xs font-bold uppercase tracking-widest font-label text-on-surface-variant">Addresses</span>
        </div>
        <p class="font-headline font-bold text-3xl text-on-surface">{{ addresses?.length || 0 }}</p>
      </div>
      <div class="bg-surface-container-lowest border border-outline-variant p-6">
        <div class="flex items-center gap-3 mb-3">
          <div class="p-2 bg-primary/10"><Heart class="w-4 h-4 text-primary" /></div>
          <span class="text-xs font-bold uppercase tracking-widest font-label text-on-surface-variant">Wishlist</span>
        </div>
        <p class="font-headline font-bold text-3xl text-on-surface">0</p>
      </div>
    </div>

    <!-- Recent Orders -->
    <div class="bg-surface-container-lowest border border-outline-variant">
      <div class="flex items-center justify-between px-6 py-5 border-b border-outline-variant">
        <p class="font-label font-bold text-xs uppercase tracking-widest text-on-surface">Recent Orders</p>
        <NuxtLink to="/account/orders" class="text-xs font-bold uppercase tracking-widest font-label text-primary hover:text-on-surface transition-colors flex items-center gap-1">
          View All <ArrowRight class="w-3 h-3" />
        </NuxtLink>
      </div>
      <div v-if="recentOrders.length">
        <NuxtLink
          v-for="order in recentOrders"
          :key="order.id"
          :to="`/orders/${order.id}`"
          class="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10 last:border-primary hover:bg-surface-container-low transition-colors"
        >
          <div>
            <p class="font-body font-bold text-sm text-on-surface">{{ order.orderNumber }}</p>
            <p class="text-xs text-on-surface-variant font-body">{{ formatDate(order.createdAt) }} &middot; {{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }}</p>
          </div>
          <div class="text-right">
            <p class="font-body font-bold text-sm text-on-surface">{{ formatPrice(order.total) }}</p>
            <span class="text-[10px] font-bold uppercase tracking-widest font-label px-2 py-0.5 rounded"
              :class="order.status === 'delivered' ? 'bg-primary/5 text-primary' : order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'">
              {{ order.status }}
            </span>
          </div>
        </NuxtLink>
      </div>
      <div v-else class="px-6 py-12 text-center">
        <Package class="w-8 h-8 text-on-surface-variant mx-auto mb-3" />
        <p class="text-sm text-on-surface-variant font-body">No orders yet</p>
        <NuxtLink to="/products" class="inline-block mt-3 text-xs font-bold uppercase tracking-widest font-label text-primary hover:text-on-surface">Start Shopping</NuxtLink>
      </div>
    </div>
  </div>
</template>
