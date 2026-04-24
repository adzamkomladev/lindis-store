<script setup lang="ts">
import {
  ArrowLeft, Package, DollarSign, ShoppingCart, Clock, TrendingUp, Pencil, Trash2,
  Eye, ExternalLink, CheckCircle2, XCircle, Loader2, ImageIcon
} from 'lucide-vue-next'
import { Skeleton } from '@/components/ui/skeleton'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const productId = route.params.id as string
const { data, pending, error, refresh } = await useFetch(`/api/admin/products/${productId}`)
const isDeleting = ref(false)

const formatPrice = (amount: number) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount / 100)
const formatDate = (date: string | Date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))

const statusChip: Record<string, { chip: string; label: string }> = {
  active:   { chip: 'bg-emerald-500/10 text-emerald-700', label: 'Active' },
  draft:    { chip: 'bg-amber-500/10 text-amber-700',     label: 'Draft' },
  archived: { chip: 'bg-[#edeeef] text-[#757681]',        label: 'Archived' }
}
const orderStatusChip: Record<string, { chip: string; label: string }> = {
  pending:    { chip: 'bg-amber-500/10 text-amber-700',    label: 'Pending' },
  processing: { chip: 'bg-[#adc3fe] text-[#394f83]',       label: 'Processing' },
  shipped:    { chip: 'bg-violet-500/10 text-violet-700',   label: 'Shipped' },
  delivered:  { chip: 'bg-emerald-500/10 text-emerald-700', label: 'Delivered' },
  cancelled:  { chip: 'bg-red-500/10 text-red-600',         label: 'Cancelled' },
}
const getStatus = (s: string) => statusChip[s] || statusChip.draft
const getOrderStatus = (s: string) => orderStatusChip[s] || orderStatusChip.pending

const { showError, confirm: confirmDialog } = useAlertDialog()
const handleDelete = async () => {
  const ok = await confirmDialog({ title: 'Delete Product', description: 'Delete this product? This cannot be undone.', confirmText: 'Delete', variant: 'error' })
  if (!ok) return
  isDeleting.value = true
  try { await $fetch(`/api/admin/products/${productId}`, { method: 'DELETE' }); navigateTo('/admin/products') }
  catch { showError('Failed', 'An error occurred') }
  finally { isDeleting.value = false }
}

const statsCards = computed(() => {
  if (!data.value?.stats) return []
  return [
    { title: 'Revenue',  value: formatPrice(data.value.stats.revenue),      icon: DollarSign,  accent: 'bg-emerald-500/10 text-emerald-600' },
    { title: 'Orders',   value: data.value.stats.totalOrders,                icon: ShoppingCart, accent: 'bg-[#adc3fe] text-[#394f83]' },
    { title: 'Pending',  value: data.value.stats.pendingOrders,              icon: Clock,        accent: 'bg-amber-500/10 text-amber-600' },
    { title: 'Sold',     value: data.value.stats.unitsSold,                  icon: TrendingUp,   accent: 'bg-violet-500/10 text-violet-600' },
  ]
})

// Orders pagination
const ordersPage = ref(1)
const ordersPageSize = 10

const allOrders = computed(() => data.value?.recentOrders ?? [])
const ordersTotalPages = computed(() => Math.max(1, Math.ceil(allOrders.value.length / ordersPageSize)))
const paginatedOrders = computed(() => {
  const start = (ordersPage.value - 1) * ordersPageSize
  return allOrders.value.slice(start, start + ordersPageSize)
})
const ordersVisiblePages = computed(() => {
  const total = ordersTotalPages.value
  const cur = ordersPage.value
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
  <div class="max-w-6xl mx-auto py-6">
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <NuxtLink to="/admin/products" class="w-9 h-9 flex items-center justify-center border border-[#c5c6d1] hover:bg-[#edeeef] transition-colors">
          <ArrowLeft class="w-4 h-4 text-[#757681]" />
        </NuxtLink>
        <div v-if="pending"><Skeleton class="h-5 w-48 bg-[#edeeef] mb-1" /><Skeleton class="h-7 w-64 bg-[#edeeef]" /></div>
        <div v-else-if="data?.product">
          <p class="text-[#475d92] font-label font-bold uppercase tracking-[0.2em] text-xs mb-0.5">Catalogue / #{{ data.product.id }}</p>
          <div class="flex items-center gap-3">
            <h2 class="font-headline font-black text-[#000622] tracking-tighter uppercase text-2xl">{{ data.product.name }}</h2>
            <span :class="[getStatus(data.product.status).chip, 'px-2.5 py-1 text-[10px] font-label font-bold uppercase tracking-widest']">{{ getStatus(data.product.status).label }}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink :to="`/products/${data?.product?.slug}`" target="_blank">
          <button class="px-4 py-2.5 border border-[#c5c6d1] text-[#000622] font-label font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-[#edeeef] transition-colors">
            <ExternalLink class="w-3.5 h-3.5" />View Live
          </button>
        </NuxtLink>
        <NuxtLink :to="`/admin/products/${productId}/edit`">
          <button class="px-4 py-2.5 monolith-gradient text-white font-label font-bold uppercase text-xs tracking-widest flex items-center gap-2">
            <Pencil class="w-3.5 h-3.5" />Edit
          </button>
        </NuxtLink>
        <button @click="handleDelete" :disabled="isDeleting"
          class="w-10 h-10 flex items-center justify-center border border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
          <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin" /><Trash2 v-else class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div v-if="pending" class="grid gap-4 sm:grid-cols-4">
      <div v-for="i in 4" :key="i" class="bg-white border border-[#c5c6d1]/20 p-5"><Skeleton class="h-9 w-9 bg-[#edeeef] mb-3" /><Skeleton class="h-6 w-20 bg-[#edeeef] mb-2" /><Skeleton class="h-3 w-16 bg-[#edeeef]" /></div>
    </div>

    <div v-else-if="error" class="bg-white border border-red-200 p-16 text-center">
      <XCircle class="w-10 h-10 text-red-400 mx-auto mb-4" />
      <h3 class="font-headline font-bold text-[#000622] uppercase tracking-tight mb-2">Failed to load product</h3>
      <button @click="refresh()" class="px-5 py-2.5 border border-[#c5c6d1] text-[#000622] font-label font-bold uppercase text-xs tracking-widest mt-3 hover:bg-[#edeeef] transition-colors">Retry</button>
    </div>

    <div v-else-if="!data?.product" class="bg-white border border-[#c5c6d1]/20 p-16 text-center">
      <Package class="w-10 h-10 text-[#c5c6d1] mx-auto mb-4" />
      <h3 class="font-headline font-bold text-[#000622] uppercase tracking-tight mb-2">Product not found</h3>
      <NuxtLink to="/admin/products" class="inline-flex items-center gap-2 mt-3 text-xs font-label font-bold uppercase tracking-widest text-[#475d92]"><ArrowLeft class="w-3.5 h-3.5" />Back</NuxtLink>
    </div>

    <div v-else class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="s in statsCards" :key="s.title" class="bg-white border border-[#c5c6d1]/20 p-5 flex items-center gap-4">
          <div :class="[s.accent, 'p-2.5']"><component :is="s.icon" class="w-4 h-4" /></div>
          <div>
            <p class="font-headline font-black text-[#000622] tracking-tighter text-xl">{{ s.value }}</p>
            <p class="text-xs font-label font-bold uppercase tracking-widest text-[#757681] mt-0.5">{{ s.title }}</p>
          </div>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white border border-[#c5c6d1]/20">
            <div class="flex items-center gap-3 px-6 py-5 border-b border-[#c5c6d1]/15">
              <div class="p-2.5 bg-[#adc3fe]"><Package class="w-4 h-4 text-[#394f83]" /></div>
              <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Product Details</p>
            </div>
            <div class="p-6 space-y-5">
              <div class="grid grid-cols-2 gap-5">
                <div><p class="text-xs text-[#757681] font-body mb-1">Name</p><p class="font-label font-bold text-sm uppercase tracking-wide text-[#000622]">{{ data.product.name }}</p></div>
                <div><p class="text-xs text-[#757681] font-body mb-1">Slug</p><p class="font-mono text-xs text-[#757681]">{{ data.product.slug }}</p></div>
                <div><p class="text-xs text-[#757681] font-body mb-1">Price</p><p class="font-headline font-black text-[#000622] tracking-tighter text-xl">{{ formatPrice(data.product.price) }}</p></div>
                <div><p class="text-xs text-[#757681] font-body mb-1">Inventory</p><p class="font-label font-bold text-sm uppercase" :class="data.product.inventoryCount < 10 ? 'text-red-500' : 'text-[#000622]'">{{ data.product.inventoryCount }} units</p></div>
              </div>
              <div class="border-t border-[#c5c6d1]/20 pt-5">
                <p class="text-xs text-[#757681] font-body mb-2">Description</p>
                <p class="text-sm text-[#454650] font-body leading-relaxed">{{ data.product.description || 'No description provided' }}</p>
              </div>
              <div class="border-t border-[#c5c6d1]/20 pt-5 grid grid-cols-2 gap-4">
                <div><p class="text-xs text-[#757681] font-body mb-1">Created</p><p class="text-xs font-body text-[#454650]">{{ formatDate(data.product.createdAt) }}</p></div>
                <div><p class="text-xs text-[#757681] font-body mb-1">Last Updated</p><p class="text-xs font-body text-[#454650]">{{ data.product.updatedAt ? formatDate(data.product.updatedAt) : 'Never' }}</p></div>
              </div>
            </div>
          </div>

          <div class="bg-white border border-[#c5c6d1]/20">
            <div class="flex items-center justify-between px-6 py-5 border-b border-[#c5c6d1]/15">
              <div class="flex items-center gap-3">
                <div class="p-2.5 bg-[#adc3fe]"><ShoppingCart class="w-4 h-4 text-[#394f83]" /></div>
                <div>
                  <p class="text-xs font-label font-bold uppercase tracking-widest text-[#757681] mb-0.5">Fulfillment</p>
                  <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Orders</p>
                </div>
              </div>
              <span v-if="allOrders.length" class="text-xs text-[#757681] font-body">{{ allOrders.length }} total</span>
            </div>
            <div v-if="allOrders.length">
              <table class="w-full">
                <thead><tr class="border-b border-[#c5c6d1]/20 bg-[#f8f9fa]">
                  <th v-for="h in ['Order','Customer','Qty','Amount','Status','']" :key="h" class="px-5 py-3 text-[10px] font-label font-bold uppercase tracking-widest text-[#757681] text-left">{{ h }}</th>
                </tr></thead>
                <tbody class="divide-y divide-[#c5c6d1]/10">
                  <tr v-for="o in paginatedOrders" :key="o.orderId" class="hover:bg-[#f8f9fa] transition-colors">
                    <td class="px-5 py-3 font-mono text-xs text-[#000622]">{{ o.orderNumber }}</td>
                    <td class="px-5 py-3 text-xs text-[#757681] font-body">{{ o.customerEmail }}</td>
                    <td class="px-5 py-3 text-xs text-[#000622]">{{ o.quantity }}</td>
                    <td class="px-5 py-3 text-xs font-label font-bold text-[#000622]">{{ formatPrice(o.priceAtPurchase * o.quantity) }}</td>
                    <td class="px-5 py-3"><span :class="[getOrderStatus(o.status).chip, 'px-2 py-0.5 text-[10px] font-label font-bold uppercase tracking-widest']">{{ getOrderStatus(o.status).label }}</span></td>
                    <td class="px-5 py-3 text-right"><NuxtLink :to="`/admin/orders/${o.orderId}`" class="text-[#475d92] hover:text-[#000622] transition-colors inline-flex"><Eye class="w-4 h-4" /></NuxtLink></td>
                  </tr>
                </tbody>
              </table>
              <!-- Pagination -->
              <div v-if="ordersTotalPages > 1" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-[#c5c6d1]/20 bg-[#f8f9fa]">
                <p class="text-xs font-body text-[#757681]">Showing {{ (ordersPage - 1) * ordersPageSize + 1 }}&ndash;{{ Math.min(ordersPage * ordersPageSize, allOrders.length) }} of {{ allOrders.length }} orders</p>
                <div class="flex items-center gap-1">
                  <button @click="ordersPage--" :disabled="ordersPage === 1" class="w-8 h-8 flex items-center justify-center border border-[#c5c6d1] text-[#757681] hover:bg-[#edeeef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-label font-bold">&lsaquo;</button>
                  <template v-for="p in ordersVisiblePages" :key="String(p)">
                    <span v-if="p === '...'" class="w-8 h-8 flex items-center justify-center text-[#c5c6d1] text-xs">&hellip;</span>
                    <button v-else @click="ordersPage = p" class="w-8 h-8 flex items-center justify-center border text-xs font-label font-bold transition-colors" :class="ordersPage === p ? 'bg-[#000622] text-white border-[#000622]' : 'border-[#c5c6d1] text-[#757681] hover:bg-[#edeeef]'">{{ p }}</button>
                  </template>
                  <button @click="ordersPage++" :disabled="ordersPage === ordersTotalPages" class="w-8 h-8 flex items-center justify-center border border-[#c5c6d1] text-[#757681] hover:bg-[#edeeef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-label font-bold">&rsaquo;</button>
                </div>
              </div>
            </div>
            <div v-else class="p-12 text-center">
              <ShoppingCart class="w-10 h-10 text-[#c5c6d1] mx-auto mb-3" />
              <p class="text-sm text-[#757681] font-body">No orders yet</p>
            </div>
          </div>
        </div>

        <div class="space-y-5">
          <div class="bg-white border border-[#c5c6d1]/20">
            <div class="flex items-center gap-3 px-5 py-4 border-b border-[#c5c6d1]/15">
              <div class="p-2 bg-violet-500/10"><ImageIcon class="w-4 h-4 text-violet-600" /></div>
              <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Images</p>
            </div>
            <div class="p-4">
              <div v-if="data?.product?.images?.length" class="space-y-3">
                <div v-for="(img, idx) in data.product.images" :key="idx" class="relative aspect-square border border-[#c5c6d1]/20 overflow-hidden">
                  <NuxtImg :src="img" :alt="`${data.product.name} ${idx+1}`" class="w-full h-full object-cover" />
                  <span v-if="idx === 0" class="absolute top-2 left-2 bg-[#000622] text-[#b1c6ff] text-[10px] font-label font-bold uppercase px-2 py-0.5">Primary</span>
                </div>
              </div>
              <div v-else class="py-10 text-center"><ImageIcon class="w-8 h-8 text-[#c5c6d1] mx-auto mb-2" /><p class="text-xs text-[#757681] font-body">No images</p></div>
            </div>
          </div>
          <div class="bg-white border border-[#c5c6d1]/20">
            <div class="px-5 py-4 border-b border-[#c5c6d1]/15"><p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Quick Actions</p></div>
            <div class="p-5 space-y-2">
              <NuxtLink :to="`/admin/products/${productId}/edit`" class="w-full flex items-center gap-2 px-4 py-2.5 border border-[#c5c6d1] text-[#000622] text-xs font-label font-bold uppercase tracking-widest hover:bg-[#edeeef] transition-colors">
                <Pencil class="w-3.5 h-3.5" />Edit Product
              </NuxtLink>
              <NuxtLink :to="`/products/${data?.product?.slug}`" target="_blank" class="w-full flex items-center gap-2 px-4 py-2.5 border border-[#c5c6d1] text-[#000622] text-xs font-label font-bold uppercase tracking-widest hover:bg-[#edeeef] transition-colors">
                <ExternalLink class="w-3.5 h-3.5" />View on Store
              </NuxtLink>
              <button @click="handleDelete" :disabled="isDeleting"
                class="w-full flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-500 text-xs font-label font-bold uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50">
                <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" /><Trash2 v-else class="w-3.5 h-3.5" />Delete Product
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
