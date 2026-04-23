<script setup lang="ts">
import {
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Package as PackageIcon,
  ShoppingBag
} from 'lucide-vue-next'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

definePageMeta({ layout: 'admin' })

const { data: orders, pending } = await useFetch('/api/admin/orders')

const searchQuery = ref('')
const statusFilter = ref('all')
const dateRange = ref('all')

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount / 100)

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))

const statusConfig: Record<string, { icon: any; chipClass: string; label: string }> = {
  pending:    { icon: Clock,         chipClass: 'bg-amber-500/10 text-amber-700',    label: 'Pending' },
  processing: { icon: PackageIcon,   chipClass: 'bg-[#adc3fe] text-[#394f83]',      label: 'Processing' },
  shipped:    { icon: Truck,         chipClass: 'bg-violet-500/10 text-violet-700',  label: 'Shipped' },
  delivered:  { icon: CheckCircle2,  chipClass: 'bg-emerald-500/10 text-emerald-700',label: 'Delivered' },
  cancelled:  { icon: XCircle,       chipClass: 'bg-red-500/10 text-red-600',        label: 'Cancelled' }
}
const getStatus = (s: string) => statusConfig[s] || statusConfig.pending

const statusOptions = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const filteredOrders = computed(() => {
  if (!orders.value) return []
  let result = orders.value
  if (statusFilter.value !== 'all') result = result.filter(o => o.status === statusFilter.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(o => o.orderNumber?.toLowerCase().includes(q) || o.guestEmail?.toLowerCase().includes(q))
  }
  return result
})

const orderStats = computed(() => {
  if (!orders.value) return { total: 0, pending: 0, delivered: 0, revenue: 0 }
  return {
    total:     orders.value.length,
    pending:   orders.value.filter(o => o.status === 'pending').length,
    delivered: orders.value.filter(o => o.status === 'delivered').length,
    revenue:   orders.value.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0)
  }
})

// Pagination
const currentPage = ref(1)
const pageSize = 15

const totalPages = computed(() => Math.max(1, Math.ceil(filteredOrders.value.length / pageSize)))
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredOrders.value.slice(start, start + pageSize)
})

// Reset to page 1 when filters change
watch([searchQuery, statusFilter, dateRange], () => { currentPage.value = 1 })

const visiblePages = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  const pages: (number | '...')[] = []
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (cur > 3) pages.push('...')
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
    if (cur < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})
</script>

<template>
  <div class="space-y-6 py-6">

    <!-- Header -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-[#475d92] font-label font-bold uppercase tracking-[0.2em] text-xs mb-1">Fulfillment</p>
        <h2 class="font-headline font-black text-[#000622] tracking-tighter uppercase text-2xl">Orders</h2>
      </div>
      <button class="border border-[#c5c6d1] px-5 py-2.5 text-[#000622] font-label font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-[#edeeef] transition-colors w-fit">
        <Download class="w-3.5 h-3.5" />
        Export
      </button>
    </div>

    <!-- Stat chips -->
    <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <div v-for="(stat, i) in [
        { label: 'Total Orders', value: orderStats.total,               accent: 'bg-[#adc3fe] text-[#394f83]', icon: ShoppingBag },
        { label: 'Pending',      value: orderStats.pending,             accent: 'bg-amber-500/10 text-amber-600', icon: Clock },
        { label: 'Delivered',    value: orderStats.delivered,           accent: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle2 },
        { label: 'Revenue',      value: formatPrice(orderStats.revenue),accent: 'bg-violet-500/10 text-violet-600', icon: Truck },
      ]" :key="i" class="bg-white border border-[#c5c6d1]/20 p-5 flex items-center gap-4">
        <div :class="[stat.accent, 'p-2.5']">
          <component :is="stat.icon" class="w-4 h-4" />
        </div>
        <div>
          <p class="font-headline font-black text-[#000622] tracking-tighter text-xl">{{ stat.value }}</p>
          <p class="text-xs font-label font-bold uppercase tracking-widest text-[#757681] mt-0.5">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white border border-[#c5c6d1]/20 p-4 flex flex-col md:flex-row gap-3">
      <!-- Search -->
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757681]" />
        <input
          v-model="searchQuery"
          placeholder="SEARCH ORDERS"
          class="w-full pl-9 pr-4 py-2.5 border border-[#c5c6d1] bg-[#f8f9fa] text-xs font-label font-bold uppercase tracking-widest focus:outline-none focus:border-[#000622] transition-colors placeholder:text-[#c5c6d1]"
        />
      </div>

      <!-- Status select -->
      <Select v-model="statusFilter">
        <SelectTrigger class="w-full md:w-52 h-10 text-xs border-[#c5c6d1] font-label uppercase tracking-widest">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
        </SelectContent>
      </Select>

      <!-- Date range -->
      <div class="flex gap-1">
        <button
          v-for="period in ['all', '7d', '30d', '90d']"
          :key="period"
          @click="dateRange = period"
          class="px-4 py-2 text-xs font-label font-bold uppercase tracking-widest transition-colors"
          :class="dateRange === period ? 'bg-[#000622] text-white' : 'bg-[#edeeef] text-[#757681] hover:bg-[#e1e3e4]'"
        >
          {{ period === 'all' ? 'All' : period }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="bg-white border border-[#c5c6d1]/20 p-8 flex justify-center">
      <div class="w-7 h-7 border-2 border-[#c5c6d1] border-t-[#000622] rounded-full animate-spin" />
    </div>

    <!-- Orders table -->
    <div v-else-if="filteredOrders?.length" class="bg-white border border-[#c5c6d1]/20 overflow-hidden">

      <!-- Mobile card list -->
      <div class="md:hidden divide-y divide-[#c5c6d1]/10">
        <NuxtLink
          v-for="order in paginatedOrders"
          :key="order.id"
          :to="`/admin/orders/${order.id}`"
          class="flex items-center justify-between p-4 hover:bg-[#f8f9fa] transition-colors"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <p class="font-label font-bold text-xs uppercase tracking-wide text-[#000622]">{{ order.orderNumber }}</p>
              <span :class="[getStatus(order.status).chipClass, 'px-2 py-0.5 text-[10px] font-label font-bold uppercase tracking-widest']">
                {{ getStatus(order.status).label }}
              </span>
            </div>
            <p class="text-xs text-[#757681] font-body truncate">{{ order.guestEmail }}</p>
          </div>
          <div class="text-right pl-3 shrink-0">
            <p class="font-label font-bold text-sm text-[#000622]">{{ formatPrice(order.total) }}</p>
          </div>
        </NuxtLink>
      </div>

      <!-- Desktop table -->
      <table class="w-full hidden md:table">
        <thead>
          <tr class="border-b border-[#c5c6d1]/20 bg-[#f8f9fa]">
            <th v-for="h in ['Order', 'Customer', 'Date', 'Status', 'Total', 'Action']" :key="h"
              class="px-6 py-3 text-[10px] font-label font-bold uppercase tracking-widest text-[#757681]"
              :class="h === 'Total' || h === 'Action' ? 'text-right' : 'text-left'">
              {{ h }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#c5c6d1]/10">
          <tr
            v-for="order in paginatedOrders"
            :key="order.id"
            class="hover:bg-[#f8f9fa] transition-colors"
          >
            <td class="px-6 py-4 font-label font-bold text-xs uppercase tracking-wide text-[#000622]">{{ order.orderNumber }}</td>
            <td class="px-6 py-4 text-sm text-[#454650] font-body">{{ order.guestEmail }}</td>
            <td class="px-6 py-4 text-xs text-[#757681] font-body">{{ formatDate(order.createdAt) }}</td>
            <td class="px-6 py-4">
              <span :class="[getStatus(order.status).chipClass, 'px-2.5 py-1 text-[10px] font-label font-bold uppercase tracking-widest inline-flex items-center gap-1.5']">
                <component :is="getStatus(order.status).icon" class="w-3 h-3" />
                {{ getStatus(order.status).label }}
              </span>
            </td>
            <td class="px-6 py-4 text-right font-label font-bold text-sm text-[#000622]">{{ formatPrice(order.total) }}</td>
            <td class="px-6 py-4 text-right">
              <NuxtLink :to="`/admin/orders/${order.id}`"
                class="inline-flex items-center justify-center w-8 h-8 text-[#757681] hover:text-[#000622] hover:bg-[#edeeef] transition-colors">
                <Eye class="w-4 h-4" />
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination footer -->
      <div v-if="totalPages > 1" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-[#c5c6d1]/20 bg-[#f8f9fa]">
        <p class="text-xs font-body text-[#757681]">
          Showing {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredOrders.length) }} of {{ filteredOrders.length }} orders
        </p>
        <div class="flex items-center gap-1">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="w-8 h-8 flex items-center justify-center border border-[#c5c6d1] text-[#757681] hover:bg-[#edeeef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-label font-bold"
          >&lsaquo;</button>
          <template v-for="p in visiblePages" :key="String(p)">
            <span v-if="p === '...'" class="w-8 h-8 flex items-center justify-center text-[#c5c6d1] text-xs">…</span>
            <button
              v-else
              @click="currentPage = p"
              class="w-8 h-8 flex items-center justify-center border text-xs font-label font-bold transition-colors"
              :class="currentPage === p ? 'bg-[#000622] text-white border-[#000622]' : 'border-[#c5c6d1] text-[#757681] hover:bg-[#edeeef]'"
            >{{ p }}</button>
          </template>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="w-8 h-8 flex items-center justify-center border border-[#c5c6d1] text-[#757681] hover:bg-[#edeeef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-label font-bold"
          >&rsaquo;</button>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="bg-white border border-[#c5c6d1]/20 p-16 text-center">
      <div class="w-14 h-14 bg-[#f3f4f5] flex items-center justify-center mx-auto mb-4">
        <ShoppingBag class="w-7 h-7 text-[#c5c6d1]" />
      </div>
      <h3 class="font-headline font-bold text-[#000622] uppercase tracking-tight mb-2">No orders found</h3>
      <p class="text-sm text-[#757681] font-body">
        {{ searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Orders will appear here once customers check out' }}
      </p>
    </div>
  </div>
</template>
