<script setup lang="ts">
import { Package, ArrowRight } from 'lucide-vue-next'

definePageMeta({ layout: 'account' })

const { data: orders, pending } = await useFetch('/api/account/orders')

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
      <h1 class="font-headline font-black text-on-surface text-3xl mb-2">My Orders</h1>
      <p class="text-sm text-on-surface-variant font-body">View and track all your orders.</p>
    </div>

    <div v-if="pending" class="space-y-4">
      <div v-for="i in 3" :key="i" class="bg-surface-container-lowest border border-outline-variant p-6 animate-pulse">
        <div class="h-4 bg-surface-container-low w-32 rounded mb-2"></div>
        <div class="h-3 bg-surface-container-low w-48 rounded"></div>
      </div>
    </div>

    <div v-else-if="orders?.length" class="space-y-4">
      <NuxtLink
        v-for="order in orders"
        :key="order.id"
        :to="`/orders/${order.id}`"
        class="block bg-surface-container-lowest border border-outline-variant p-6 hover:border-primary/20 transition-colors"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <p class="font-body font-bold text-lg text-on-surface">{{ order.orderNumber }}</p>
              <span class="text-[10px] font-bold uppercase tracking-widest font-label px-2 py-0.5 rounded"
                :class="order.status === 'delivered' ? 'bg-primary/5 text-primary' : order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'">
                {{ order.status }}
              </span>
            </div>
            <p class="text-xs text-on-surface-variant font-body">{{ formatDate(order.createdAt) }} &middot; {{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }}</p>
          </div>
          <div class="flex items-center gap-6">
            <p class="font-body font-bold text-lg text-on-surface">{{ formatPrice(order.total) }}</p>
            <ArrowRight class="w-4 h-4 text-on-surface-variant" />
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-outline-variant/10 flex gap-3">
          <div
            v-for="item in order.items.slice(0, 3)"
            :key="item.productSlug"
            class="w-12 h-12 bg-surface-container-low rounded border border-outline-variant/10 overflow-hidden"
          >
            <NuxtImg v-if="item.productImages?.[0]" :src="item.productImages[0]" class="w-full h-full object-cover" />
            <Package v-else class="w-6 h-6 text-on-surface-variant m-3" />
          </div>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="bg-surface-container-lowest border border-outline-variant p-12 text-center">
      <Package class="w-10 h-10 text-on-surface-variant mx-auto mb-4" />
      <h3 class="font-headline font-bold text-xl text-on-surface mb-2">No orders yet</h3>
      <p class="text-sm text-on-surface-variant font-body mb-6">You haven't placed any orders yet.</p>
      <NuxtLink to="/products" class="inline-block px-6 py-3 bg-primary text-white font-label font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity">
        Start Shopping
      </NuxtLink>
    </div>
  </div>
</template>
