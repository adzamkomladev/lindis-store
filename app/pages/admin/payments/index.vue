<script setup lang="ts">
import {
  Search, Download, CreditCard, Clock, CheckCircle2, XCircle, ArrowUpRight, DollarSign
} from 'lucide-vue-next'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

definePageMeta({ layout: 'admin' })

const { data: payments, pending } = await useFetch('/api/admin/payments')
const searchQuery = ref('')
const statusFilter = ref('all')

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount / 100)

const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))

const statusConfig: Record<string, { icon: any; chipClass: string; label: string }> = {
  pending: { icon: Clock,        chipClass: 'bg-amber-500/10 text-amber-700',     label: 'Pending' },
  success: { icon: CheckCircle2, chipClass: 'bg-primary/10 text-primary', label: 'Success' },
  failed:  { icon: XCircle,      chipClass: 'bg-red-500/10 text-red-600',         label: 'Failed' }
}
const getStatus = (s: string) => statusConfig[s] || statusConfig.pending

const filteredPayments = computed(() => {
  if (!payments.value) return []
  let result = payments.value
  if (statusFilter.value !== 'all') result = result.filter((p: any) => p.status === statusFilter.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((p: any) =>
      p.reference?.toLowerCase().includes(q) ||
      p.orderNumber?.toLowerCase().includes(q) ||
      p.guestEmail?.toLowerCase().includes(q))
  }
  return result
})

const paymentStats = computed(() => {
  if (!payments.value) return { total: 0, successful: 0, pending: 0, totalAmount: 0 }
  return {
    total:       payments.value.length,
    successful:  payments.value.filter((p: any) => p.status === 'success').length,
    pending:     payments.value.filter((p: any) => p.status === 'pending').length,
    totalAmount: payments.value.filter((p: any) => p.status === 'success').reduce((s: number, p: any) => s + p.amount, 0)
  }
})

const statusOptions = [
  { value: 'all', label: 'All Payments' },
  { value: 'pending', label: 'Pending' },
  { value: 'success', label: 'Successful' },
  { value: 'failed', label: 'Failed' },
]

// Pagination
const currentPage = ref(1)
const pageSize = 20

const totalPages = computed(() => Math.max(1, Math.ceil(filteredPayments.value.length / pageSize)))
const paginatedPayments = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredPayments.value.slice(start, start + pageSize)
})

watch([searchQuery, statusFilter], () => { currentPage.value = 1 })

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
        <p class="text-primary font-label font-bold uppercase tracking-[0.2em] text-xs mb-1">Finance</p>
        <h2 class="font-headline font-black text-on-surface tracking-tighter uppercase text-on-surfacexl">Payments</h2>
      </div>
      <button class="border border-outline-variant px-5 py-2.5 text-on-surface font-label font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-surface-container-low transition-colors w-fit">
        <Download class="w-3.5 h-3.5" />Export
      </button>
    </div>

    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="(stat, i) in [
        { label: 'Total',      value: paymentStats.total,                      accent: 'bg-[#adc3fe] text-primary',       icon: CreditCard },
        { label: 'Successful', value: paymentStats.successful,                  accent: 'bg-primary/10 text-primary', icon: CheckCircle2 },
        { label: 'Pending',    value: paymentStats.pending,                     accent: 'bg-amber-500/10 text-amber-600',     icon: Clock },
        { label: 'Revenue',    value: formatPrice(paymentStats.totalAmount),    accent: 'bg-violet-500/10 text-violet-600',   icon: DollarSign },
      ]" :key="i" class="bg-surface-container-lowest border border-outline-variant p-5 flex items-center gap-4">
        <div :class="[stat.accent, 'p-2.5']">
          <component :is="stat.icon" class="w-4 h-4" />
        </div>
        <div>
          <p class="font-headline font-black text-on-surface tracking-tighter text-xl">{{ stat.value }}</p>
          <p class="text-xs font-label font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-surface-container-lowest border border-outline-variant p-4 flex flex-col md:flex-row gap-3">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
        <input
          v-model="searchQuery"
          placeholder="SEARCH PAYMENTS"
          class="w-full pl-9 pr-4 py-2.5 border border-outline-variant bg-surface-container-low label-md focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant"
        />
      </div>
      <Select v-model="statusFilter">
        <SelectTrigger class="w-full md:w-52 h-10 border-outline-variant text-xs font-label uppercase tracking-widest">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="bg-surface-container-lowest border border-outline-variant p-6 space-y-4">
      <div v-for="i in 5" :key="i" class="flex items-center gap-4">
        <Skeleton class="h-10 w-10 bg-surface-container-low" />
        <div class="flex-1 space-y-2">
          <Skeleton class="h-3 w-32 bg-surface-container-low" /><Skeleton class="h-2.5 w-48 bg-surface-container-low" />
        </div>
        <Skeleton class="h-5 w-16 bg-surface-container-low" />
      </div>
    </div>

    <!-- Payments table -->
    <div v-else-if="filteredPayments.length" class="bg-surface-container-lowest border border-outline-variant overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-outline-variant bg-surface-container-low">
            <th v-for="h in ['Reference', 'Order', 'Customer', 'Amount', 'Status', 'Date', 'Action']" :key="h"
              class="px-6 py-3 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant"
              :class="h === 'Amount' || h === 'Action' ? 'text-right' : 'text-left'">
              {{ h }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#c5c6d1]/10">
          <tr v-for="payment in paginatedPayments" :key="payment.id" class="hover:bg-surface-container-low transition-colors">
            <td class="px-6 py-4 font-mono text-xs text-on-surface-variant">{{ payment.reference }}</td>
            <td class="px-6 py-4">
              <NuxtLink v-if="payment.orderId" :to="`/admin/orders/${payment.orderId}`"
                class="font-label font-bold text-xs uppercase text-primary hover:text-on-surface transition-colors tracking-wide">
                {{ payment.orderNumber }}
              </NuxtLink>
              <span v-else class="text-on-surface-variant">—</span>
            </td>
            <td class="px-6 py-4 text-xs text-on-surface-variant font-body">{{ payment.guestEmail || '—' }}</td>
            <td class="px-6 py-4 text-right font-label font-bold text-sm text-on-surface">{{ formatPrice(payment.amount) }}</td>
            <td class="px-6 py-4">
              <span :class="[getStatus(payment.status).chipClass, 'px-2.5 py-1 text-[10px] font-label font-bold uppercase tracking-widest inline-flex items-center gap-1.5']">
                <component :is="getStatus(payment.status).icon" class="w-3 h-3" />
                {{ getStatus(payment.status).label }}
              </span>
            </td>
            <td class="px-6 py-4 text-xs text-on-surface-variant font-body">{{ formatDate(payment.createdAt) }}</td>
            <td class="px-6 py-4 text-right">
              <NuxtLink v-if="payment.orderId" :to="`/admin/orders/${payment.orderId}`"
                class="inline-flex items-center gap-1 text-xs text-primary hover:text-on-surface font-label font-bold uppercase tracking-wide transition-colors">
                View <ArrowUpRight class="w-3 h-3" />
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-low">
        <p class="text-xs font-body text-on-surface-variant">Showing {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredPayments.length) }} of {{ filteredPayments.length }} payments</p>
        <div class="flex items-center gap-1">
          <button @click="currentPage--" :disabled="currentPage === 1" class="w-8 h-8 flex items-center justify-center border border-outline-variant text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-label font-bold">&lsaquo;</button>
          <template v-for="p in visiblePages" :key="String(p)">
            <span v-if="p === '...'" class="w-8 h-8 flex items-center justify-center text-on-surface-variant text-xs">…</span>
            <button v-else @click="currentPage = p" class="w-8 h-8 flex items-center justify-center border text-xs font-label font-bold transition-colors" :class="currentPage === p ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'">{{ p }}</button>
          </template>
          <button @click="currentPage++" :disabled="currentPage === totalPages" class="w-8 h-8 flex items-center justify-center border border-outline-variant text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-label font-bold">&rsaquo;</button>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="bg-surface-container-lowest border border-outline-variant p-16 text-center">
      <div class="w-14 h-14 bg-surface-container-low flex items-center justify-center mx-auto mb-4">
        <CreditCard class="w-7 h-7 text-on-surface-variant" />
      </div>
      <h3 class="font-headline font-bold text-on-surface uppercase tracking-tight mb-2">No payments found</h3>
      <p class="text-sm text-on-surface-variant font-body">Payments will appear here once customers make purchases</p>
    </div>
  </div>
</template>
