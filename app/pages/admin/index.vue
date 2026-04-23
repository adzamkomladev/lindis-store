<script setup lang="ts">
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-vue-next'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'

definePageMeta({
  layout: 'admin'
})

  const { data: stats, pending: statsPending } = await useFetch('/api/admin/stats')
  const { data: recentOrders, pending: ordersPending } = await useFetch('/api/admin/orders/recent')
  const { data: topSellers, pending: topSellersPending } = await useFetch('/api/admin/top-sellers')
  const revenuePeriod = ref('month')
  const { data: revenueData, pending: revenuePending } = await useFetch('/api/admin/revenue', {
    query: computed(() => ({ period: revenuePeriod.value }))
  })

const maxRevenue = computed(() => {
  if (!revenueData.value?.revenue?.length) return 1
  return Math.max(...revenueData.value.revenue) || 1
})

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS'
  }).format((amount || 0) / 100)
}

const formatDate = (date: string | Date) => {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d)
}

const statsCards = computed(() => [
  {
    title: 'Revenue',
    value: formatPrice(stats.value?.revenue || 0),
    change: '+12.5%',
    changeType: 'positive' as const,
    icon: DollarSign,
    accent: 'bg-emerald-500/10 text-emerald-600'
  },
  {
    title: 'Orders',
    value: stats.value?.orders || 0,
    change: '+8.2%',
    changeType: 'positive' as const,
    icon: ShoppingCart,
    accent: 'bg-[#adc3fe] text-[#394f83]'
  },
  {
    title: 'Products',
    value: stats.value?.products || 0,
    change: '+3',
    changeType: 'neutral' as const,
    icon: Package,
    accent: 'bg-violet-500/10 text-violet-600'
  },
  {
    title: 'Conversion',
    value: '3.2%',
    change: '-0.4%',
    changeType: 'negative' as const,
    icon: TrendingUp,
    accent: 'bg-amber-500/10 text-amber-600'
  }
])

const getStatusConfig = (status: string) => {
  const configs: Record<string, { icon: any, class: string, label: string }> = {
    delivered: { icon: CheckCircle2, class: 'bg-emerald-500/10 text-emerald-700', label: 'Delivered' },
    shipped: { icon: Package, class: 'bg-[#adc3fe] text-[#394f83]', label: 'Shipped' },
    processing: { icon: Clock, class: 'bg-violet-500/10 text-violet-700', label: 'Processing' },
    pending: { icon: Clock, class: 'bg-amber-500/10 text-amber-700', label: 'Pending' },
    cancelled: { icon: XCircle, class: 'bg-red-500/10 text-red-600', label: 'Cancelled' },
  }
  return configs[status] || configs.pending
}
</script>

<template>
  <div class="space-y-6 py-6">

    <!-- Page Header -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="font-headline font-medium italic text-4xl text-on-surface mb-2">Revenue Dashboard</h2>
        <p class="font-body text-on-surface-variant text-sm">Monitoring the pulse of Lindi's culinary collection</p>
      </div>
      <div class="flex gap-3">
        <NuxtLink
          to="/admin/products/create"
          class="monolith-gradient px-5 py-2.5 text-white font-label font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus class="w-3.5 h-3.5" />
          Add Product
        </NuxtLink>
        <NuxtLink
          to="/admin/orders"
          class="px-5 py-2.5 border border-outline-variant/30 text-on-surface font-label font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-surface-container-low transition-colors rounded-md"
        >
          <Eye class="w-3.5 h-3.5" />
          View Orders
        </NuxtLink>
      </div>
    </div>

    <!-- Stat Cards: 4-column -->
    <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <div
        v-for="stat in statsCards"
        :key="stat.title"
        class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-6"
      >
        <div class="flex items-start justify-between mb-4">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-widest font-label text-on-surface-variant mb-2">{{ stat.title }}</p>
            <template v-if="statsPending">
              <Skeleton class="h-7 w-20 bg-surface-container" />
            </template>
            <p v-else class="font-headline font-bold text-on-surface tracking-tight text-3xl">{{ stat.value }}</p>
          </div>
          <div :class="[stat.accent, 'p-2 rounded-md']">
            <component :is="stat.icon" class="w-4 h-4" />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 font-label"
            :class="stat.changeType === 'positive' ? 'bg-emerald-500/10 text-emerald-700'
              : stat.changeType === 'negative' ? 'bg-red-500/10 text-red-600'
              : 'bg-[#edeeef] text-[#757681]'"
          >
            <ArrowUpRight v-if="stat.changeType === 'positive'" class="w-2.5 h-2.5" />
            <ArrowDownRight v-else-if="stat.changeType === 'negative'" class="w-2.5 h-2.5" />
            {{ stat.change }}
          </span>
          <span class="text-[10px] text-on-surface-variant font-body hidden sm:inline">vs last month</span>
        </div>
      </div>
    </div>

    <!-- Revenue Chart -->
    <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-6 md:p-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h3 class="font-headline font-medium italic text-xl text-on-surface mb-1">Revenue Flow</h3>
          <p class="text-[11px] font-body text-on-surface-variant">Performance trends for the current fiscal period</p>
        </div>
        <div class="flex gap-2">
          <button
            v-for="period in ['week', 'month', 'year']"
            :key="period"
            @click="revenuePeriod = period"
            class="px-4 py-2 text-xs font-bold uppercase tracking-widest font-label transition-colors"
            :class="revenuePeriod === period
              ? 'bg-[#000622] text-white'
              : 'bg-[#edeeef] text-[#757681] hover:bg-[#e1e3e4]'"
          >
            {{ period }}
          </button>
        </div>
      </div>

      <!-- Chart bars -->
      <div class="h-44">
        <div v-if="revenuePending" class="h-full flex items-end gap-2">
          <div v-for="i in 12" :key="i" class="flex-1 animate-pulse bg-[#edeeef]" :style="{ height: `${20 + Math.random() * 80}%` }" />
        </div>
        <template v-else-if="revenueData">
          <div class="flex items-end justify-between gap-1.5 h-full">
            <div
              v-for="(amount, index) in revenueData.revenue"
              :key="index"
              class="flex-1 transition-all hover:opacity-80 cursor-pointer"
              :style="{ height: `${Math.max(3, (amount / maxRevenue) * 100)}%` }"
              :class="amount > 0 ? 'bg-[#475d92]' : 'bg-[#edeeef]'"
            />
          </div>
          <div class="flex justify-between mt-2">
            <span
              v-for="(label, idx) in revenueData.labels"
              :key="idx"
              class="text-[9px] md:text-[10px] text-[#757681] font-label"
              :class="{'hidden sm:inline': revenueData.labels.length > 7 && idx % 2 !== 0}"
            >{{ label }}</span>
          </div>
        </template>
      </div>

      <!-- Summary row -->
      <div v-if="revenueData" class="flex flex-wrap gap-6 mt-6 pt-5 border-t border-[#c5c6d1]/15">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-[#475d92]"></div>
          <span class="text-xs font-body text-[#757681]">Revenue: <span class="font-bold text-[#000622]">{{ formatPrice(revenueData.totalRevenue) }}</span></span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-[#adc3fe]"></div>
          <span class="text-xs font-body text-[#757681]">Orders: <span class="font-bold text-[#000622]">{{ revenueData.totalOrders }}</span></span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-amber-400"></div>
          <span class="text-xs font-body text-[#757681]">Avg. Order: <span class="font-bold text-[#000622]">{{ formatPrice(revenueData.avgOrder) }}</span></span>
        </div>
      </div>
    </div>

    <!-- Bottom Grid: Orders + Performance -->
    <div class="grid gap-4 md:gap-6 lg:grid-cols-3">

      <!-- Recent Orders (2/3 wide) -->
      <div class="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 py-6">
        <div class="flex items-center justify-between px-6 pb-5">
          <div>
            <h3 class="font-headline font-medium italic text-xl text-on-surface mb-1">Recent Orders</h3>
            <p class="text-[11px] font-body text-on-surface-variant">Real-time purchase activity across the storefront</p>
          </div>
          <NuxtLink
            to="/admin/orders"
            class="px-4 py-2 bg-surface-container-low text-on-surface hover:bg-surface-container rounded-md text-[10px] font-bold uppercase tracking-widest font-label transition-colors"
          >
            Filter
          </NuxtLink>
        </div>
        
        <!-- Headers -->
        <div class="grid grid-cols-12 gap-4 px-6 pb-2 pt-4 border-b border-outline-variant/10 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">
           <div class="col-span-3">Order ID</div>
           <div class="col-span-3">Customer</div>
           <div class="col-span-2 text-center">Items</div>
           <div class="col-span-2 text-center">Status</div>
           <div class="col-span-2 text-right">Amount</div>
        </div>

        <!-- Loading -->
        <div v-if="ordersPending">
          <div v-for="i in 4" :key="i" class="flex items-center justify-between px-6 py-4">
            <div class="flex items-center gap-4">
              <Skeleton class="w-9 h-9 bg-[#edeeef]" />
              <div class="space-y-1.5">
                <Skeleton class="h-3 w-24 bg-[#edeeef]" />
                <Skeleton class="h-2.5 w-32 bg-[#edeeef]" />
              </div>
            </div>
            <Skeleton class="h-5 w-16 bg-[#edeeef]" />
          </div>
        </div>

        <!-- Orders list -->
        <div v-else-if="recentOrders?.length">
          <NuxtLink
            v-for="order in recentOrders"
            :key="order.id"
            :to="`/admin/orders/${order.id}`"
            class="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-surface-container-low transition-colors"
          >
             <div class="col-span-3 font-body text-sm font-bold text-on-surface">#ORD-{{ order.orderNumber.substring(0, 4) }}</div>
             <div class="col-span-3 font-body text-sm text-on-surface flex items-center gap-2">
               <div class="text-[10px] font-label font-bold rounded-full w-6 h-6 flex items-center justify-center bg-secondary/10 text-secondary uppercase">{{ order.customerName.substring(0, 2) }}</div>
               <span class="truncate">{{ order.customerName }}</span>
             </div>
             <div class="col-span-2 text-center text-on-surface-variant font-body text-sm">{{ order.items?.length || 1 }} items</div>
             <div class="col-span-2 text-center">
                <span class="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded" :class="getStatusConfig(order.status).class">
                  {{ getStatusConfig(order.status).label }}
                </span>
             </div>
             <div class="col-span-2 text-right font-body font-bold text-sm text-on-surface">
               {{ formatPrice(order.total) }}
             </div>
          </NuxtLink>
        </div>

        <div v-else class="flex flex-col items-center justify-center py-16 text-[#757681]">
          <ShoppingCart class="w-10 h-10 mb-3 opacity-30" />
          <p class="text-sm font-body">No orders yet</p>
        </div>
      </div>

      <!-- Right Column: Top Sellers -->
      <div class="space-y-4">
        <!-- Top Sellers card -->
        <div class="bg-primary text-white rounded-xl shadow-md p-6 h-full border border-primary-container">
          <h3 class="font-headline font-medium italic text-xl mb-6">Top Sellers</h3>

          <div v-if="topSellersPending" class="space-y-6">
            <div v-for="i in 3" :key="i" class="flex items-center gap-4 animate-pulse">
              <div class="w-12 h-12 rounded-md bg-white/10"></div>
              <div class="flex-1 space-y-2">
                <div class="h-3 bg-white/20 w-3/4 rounded"></div>
                <div class="h-2 bg-white/10 w-1/3 rounded"></div>
              </div>
            </div>
          </div>

          <div v-else-if="topSellers?.length" class="space-y-6">
            <NuxtLink
              v-for="item in topSellers.slice(0, 3)"
              :key="item.productId"
              :to="`/products/${item.slug}`"
              target="_blank"
              class="flex items-center gap-4 group"
            >
              <div class="w-12 h-12 rounded-md bg-white/10 flex-shrink-0 flex items-center justify-center text-white/50 overflow-hidden">
                <img v-if="item.images?.[0]" :src="`/images/${item.images[0]}`" class="w-full h-full object-cover" />
                <span v-else class="material-symbols-outlined text-xl">restaurant</span>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-body text-sm font-bold truncate group-hover:text-secondary transition-colors">{{ item.name }}</h4>
                <p class="text-[10px] font-label uppercase tracking-widest text-secondary mt-0.5">{{ item.totalSold }} Sold</p>
              </div>
              <span class="font-body font-bold text-sm">{{ new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(item.price / 100) }}</span>
            </NuxtLink>
          </div>

          <div v-else class="py-8 text-center">
            <p class="text-sm text-white/60 font-body">No sales data yet</p>
          </div>

          <NuxtLink to="/admin/products" class="block w-full mt-8 py-3 rounded-md border border-white/20 text-white font-label uppercase text-[10px] font-bold tracking-widest hover:bg-white/5 transition-colors text-center">
            View All Products
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
