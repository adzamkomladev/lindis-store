<script setup lang="ts">
import {
  Plus,
  MoreHorizontal,
  Package,
  Search,
  Grid3x3,
  List,
  Pencil,
  Trash2,
  Eye,
  Archive,
  CheckCircle2
} from 'lucide-vue-next'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'

definePageMeta({ layout: 'admin' })

const { data: products, pending, refresh } = await useFetch('/api/admin/products')

const searchQuery = ref('')
const viewMode = ref<'grid' | 'table'>('table')
const statusFilter = ref('all')

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount / 100)

const statusConfig: Record<string, { chipClass: string; label: string }> = {
  active:   { chipClass: 'bg-emerald-500/10 text-emerald-700', label: 'Active' },
  draft:    { chipClass: 'bg-amber-500/10 text-amber-700',     label: 'Draft' },
  archived: { chipClass: 'bg-[#edeeef] text-[#757681]',       label: 'Archived' }
}
const getStatus = (s: string) => statusConfig[s] || statusConfig.draft

const filteredProducts = computed(() => {
  if (!products.value) return []
  let result = products.value
  if (statusFilter.value !== 'all') result = result.filter(p => p.status === statusFilter.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(p => p.name?.toLowerCase().includes(q))
  }
  return result
})

const productStats = computed(() => {
  if (!products.value) return { total: 0, active: 0, draft: 0, lowStock: 0 }
  return {
    total:    products.value.length,
    active:   products.value.filter(p => p.status === 'active').length,
    draft:    products.value.filter(p => p.status === 'draft').length,
    lowStock: products.value.filter(p => p.inventoryCount < 10).length
  }
})

const selectedProducts = ref<string[]>([])
const selectAll = ref(false)

const toggleSelectAll = () => {
  if (selectAll.value) selectedProducts.value = filteredProducts.value.map(p => p.id)
  else selectedProducts.value = []
}

const toggleProduct = (id: string) => {
  const i = selectedProducts.value.indexOf(id)
  if (i > -1) selectedProducts.value.splice(i, 1)
  else selectedProducts.value.push(id)
  selectAll.value = selectedProducts.value.length === filteredProducts.value.length
}

const clearSelection = () => { selectedProducts.value = []; selectAll.value = false }
const bulkPublish = () => { console.log('Publishing products:', selectedProducts.value); clearSelection() }
const bulkDraft   = () => { console.log('Setting to draft:', selectedProducts.value); clearSelection() }
const bulkDelete  = () => { console.log('Deleting products:', selectedProducts.value); clearSelection() }

// Pagination
const currentPage = ref(1)
const pageSize = 12

const totalPages = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / pageSize)))
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredProducts.value.slice(start, start + pageSize)
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
        <p class="text-[#475d92] font-label font-bold uppercase tracking-[0.2em] text-xs mb-1">Catalog</p>
        <h2 class="font-headline font-black text-[#000622] tracking-tighter uppercase text-2xl">Products</h2>
      </div>
      <NuxtLink
        to="/admin/products/create"
        class="monolith-gradient px-5 py-2.5 text-white font-label font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:opacity-90 transition-opacity w-fit"
      >
        <Plus class="w-3.5 h-3.5" />
        Add Product
      </NuxtLink>
    </div>

    <!-- Stat chips -->
    <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <div v-for="(stat, i) in [
        { label: 'Total',    value: productStats.total,    accent: 'bg-[#adc3fe] text-[#394f83]', icon: Package },
        { label: 'Active',   value: productStats.active,   accent: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle2 },
        { label: 'Draft',    value: productStats.draft,    accent: 'bg-amber-500/10 text-amber-600', icon: Pencil },
        { label: 'Low Stock',value: productStats.lowStock, accent: 'bg-red-500/10 text-red-600', icon: Archive },
      ]" :key="i" class="bg-white border border-[#c5c6d1]/20 p-5 flex items-center gap-4">
        <div :class="[stat.accent, 'p-2.5']">
          <component :is="stat.icon" class="w-4 h-4" />
        </div>
        <div>
          <p class="font-headline font-black text-[#000622] tracking-tighter text-2xl">{{ stat.value }}</p>
          <p class="text-xs font-label font-bold uppercase tracking-widest text-[#757681] mt-0.5">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="bg-white border border-[#c5c6d1]/20 p-4 flex flex-col md:flex-row gap-3">
      <!-- Search -->
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757681]" />
        <input
          v-model="searchQuery"
          placeholder="SEARCH PRODUCTS"
          class="w-full pl-9 pr-4 py-2.5 border border-[#c5c6d1] bg-[#f8f9fa] text-xs font-label font-bold uppercase tracking-widest focus:outline-none focus:border-[#000622] transition-colors placeholder:text-[#c5c6d1]"
        />
      </div>

      <!-- Status filter -->
      <Select v-model="statusFilter">
        <SelectTrigger class="w-full md:w-44 h-10 text-xs border-[#c5c6d1] font-label uppercase tracking-widest">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>

      <!-- View toggle (desktop) -->
      <div class="hidden md:flex items-center border border-[#c5c6d1]">
        <button
          @click="viewMode = 'table'"
          class="w-10 h-10 flex items-center justify-center transition-colors"
          :class="viewMode === 'table' ? 'bg-[#000622] text-white' : 'text-[#757681] hover:bg-[#edeeef]'"
        ><List class="w-4 h-4" /></button>
        <button
          @click="viewMode = 'grid'"
          class="w-10 h-10 flex items-center justify-center transition-colors"
          :class="viewMode === 'grid' ? 'bg-[#000622] text-white' : 'text-[#757681] hover:bg-[#edeeef]'"
        ><Grid3x3 class="w-4 h-4" /></button>
      </div>
    </div>

    <!-- Bulk Actions Banner -->
    <div
      v-if="selectedProducts.length > 0"
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-[#000622] text-white"
    >
      <div class="flex items-center gap-4">
        <span class="text-sm font-label font-bold uppercase tracking-widest">
          {{ selectedProducts.length }} selected
        </span>
        <button @click="clearSelection" class="text-xs text-white/50 hover:text-white transition-colors font-label uppercase tracking-widest">
          Clear
        </button>
      </div>
      <div class="flex gap-2">
        <button @click="bulkPublish" class="px-4 py-2 bg-emerald-600 text-white text-xs font-label font-bold uppercase tracking-widest flex items-center gap-1.5 hover:bg-emerald-700 transition-colors">
          <CheckCircle2 class="w-3.5 h-3.5" />Publish
        </button>
        <button @click="bulkDraft" class="px-4 py-2 border border-amber-400 text-amber-300 text-xs font-label font-bold uppercase tracking-widest flex items-center gap-1.5 hover:bg-amber-500/20 transition-colors">
          <Pencil class="w-3.5 h-3.5" />Draft
        </button>
        <button @click="bulkDelete" class="px-4 py-2 border border-red-400 text-red-400 text-xs font-label font-bold uppercase tracking-widest flex items-center gap-1.5 hover:bg-red-500/20 transition-colors">
          <Trash2 class="w-3.5 h-3.5" />Delete
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="bg-white border border-[#c5c6d1]/20 p-8 flex justify-center">
      <div class="w-7 h-7 border-2 border-[#c5c6d1] border-t-[#000622] rounded-full animate-spin" />
    </div>

    <!-- Empty -->
    <div v-else-if="!filteredProducts?.length" class="bg-white border border-[#c5c6d1]/20 p-16 text-center">
      <div class="w-14 h-14 bg-[#f3f4f5] flex items-center justify-center mx-auto mb-4">
        <Package class="w-7 h-7 text-[#c5c6d1]" />
      </div>
      <h3 class="font-headline font-bold text-[#000622] uppercase tracking-tight mb-2">No products found</h3>
      <p class="text-sm text-[#757681] font-body mb-6">
        {{ searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Get started by adding your first product' }}
      </p>
      <NuxtLink v-if="!searchQuery && statusFilter === 'all'" to="/admin/products/create"
        class="monolith-gradient px-6 py-3 text-white font-label font-bold uppercase text-xs tracking-widest inline-flex items-center gap-2">
        <Plus class="w-3.5 h-3.5" />Add Product
      </NuxtLink>
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="space-y-4">
      <div class="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div
          v-for="product in paginatedProducts"
          :key="product.id"
          class="bg-white border border-[#c5c6d1]/20 overflow-hidden group"
        >
          <div class="aspect-square bg-[#f3f4f5] relative overflow-hidden">
            <img
              v-if="product.images?.length"
              :src="`/images/${product.images[0]}`"
              :alt="product.name"
              class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Package class="w-12 h-12 text-[#c5c6d1]" />
            </div>
            <!-- Status chip -->
            <span :class="[getStatus(product.status).chipClass, 'absolute top-2 left-2 px-2 py-0.5 text-[10px] font-label font-bold uppercase tracking-widest']">
              {{ getStatus(product.status).label }}
            </span>
            <!-- Hover actions -->
            <div class="absolute inset-0 bg-[#000622]/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <NuxtLink :to="`/admin/products/${product.id}`"
                class="w-9 h-9 bg-white flex items-center justify-center hover:bg-[#f3f4f5] transition-colors">
                <Eye class="w-4 h-4 text-[#000622]" />
              </NuxtLink>
              <NuxtLink :to="`/admin/products/${product.id}/edit`"
                class="w-9 h-9 bg-white flex items-center justify-center hover:bg-[#f3f4f5] transition-colors">
                <Pencil class="w-4 h-4 text-[#000622]" />
              </NuxtLink>
            </div>
          </div>
          <div class="p-4">
            <NuxtLink :to="`/admin/products/${product.id}`">
              <p class="font-label font-bold text-xs uppercase tracking-wide text-[#000622] truncate hover:text-[#475d92] transition-colors">{{ product.name }}</p>
            </NuxtLink>
            <div class="flex items-center justify-between mt-2">
              <p class="font-headline font-bold text-[#000622] tracking-tight">{{ formatPrice(product.price) }}</p>
              <p class="text-xs text-[#757681] font-body">{{ product.inventoryCount }} units</p>
            </div>
          </div>
        </div>
      </div>
      <!-- Grid Pagination -->
      <div v-if="totalPages > 1" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 bg-white border border-[#c5c6d1]/20">
        <p class="text-xs font-body text-[#757681]">Showing {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredProducts.length) }} of {{ filteredProducts.length }} products</p>
        <div class="flex items-center gap-1">
          <button @click="currentPage--" :disabled="currentPage === 1" class="w-8 h-8 flex items-center justify-center border border-[#c5c6d1] text-[#757681] hover:bg-[#edeeef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-label font-bold">&lsaquo;</button>
          <template v-for="p in visiblePages" :key="String(p)">
            <span v-if="p === '...'" class="w-8 h-8 flex items-center justify-center text-[#c5c6d1] text-xs">…</span>
            <button v-else @click="currentPage = p" class="w-8 h-8 flex items-center justify-center border text-xs font-label font-bold transition-colors" :class="currentPage === p ? 'bg-[#000622] text-white border-[#000622]' : 'border-[#c5c6d1] text-[#757681] hover:bg-[#edeeef]'">{{ p }}</button>
          </template>
          <button @click="currentPage++" :disabled="currentPage === totalPages" class="w-8 h-8 flex items-center justify-center border border-[#c5c6d1] text-[#757681] hover:bg-[#edeeef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-label font-bold">&rsaquo;</button>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div v-else class="bg-white border border-[#c5c6d1]/20 overflow-hidden hidden md:block">
      <table class="w-full">
        <thead>
          <tr class="border-b border-[#c5c6d1]/20 bg-[#f8f9fa]">
            <th class="px-6 py-3 text-left">
              <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" class="w-4 h-4 border border-[#c5c6d1]" />
            </th>
            <th class="px-6 py-3 text-left text-[10px] font-label font-bold uppercase tracking-widest text-[#757681]">Product</th>
            <th class="px-6 py-3 text-left text-[10px] font-label font-bold uppercase tracking-widest text-[#757681]">Status</th>
            <th class="px-6 py-3 text-left text-[10px] font-label font-bold uppercase tracking-widest text-[#757681]">Price</th>
            <th class="px-6 py-3 text-left text-[10px] font-label font-bold uppercase tracking-widest text-[#757681]">Inventory</th>
            <th class="px-6 py-3 text-right text-[10px] font-label font-bold uppercase tracking-widest text-[#757681]">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#c5c6d1]/10">
          <tr
            v-for="product in paginatedProducts"
            :key="product.id"
            class="hover:bg-[#f8f9fa] transition-colors"
          >
            <td class="px-6 py-4">
              <input
                type="checkbox"
                :checked="selectedProducts.includes(product.id)"
                @change="toggleProduct(product.id)"
                class="w-4 h-4 border border-[#c5c6d1]"
              />
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-4">
                <div class="w-11 h-11 bg-[#f3f4f5] overflow-hidden shrink-0 flex items-center justify-center">
                  <img v-if="product.images?.length" :src="`/images/${product.images[0]}`" :alt="product.name" class="w-full h-full object-cover" />
                  <Package v-else class="w-5 h-5 text-[#c5c6d1]" />
                </div>
                <div>
                  <p class="font-label font-bold text-xs uppercase tracking-wide text-[#000622]">{{ product.name }}</p>
                  <p class="text-xs text-[#757681] font-body mt-0.5">{{ product.slug }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span :class="[getStatus(product.status).chipClass, 'px-2.5 py-1 text-[10px] font-label font-bold uppercase tracking-widest']">
                {{ getStatus(product.status).label }}
              </span>
            </td>
            <td class="px-6 py-4">
              <span class="font-label font-bold text-sm text-[#000622]">{{ formatPrice(product.price) }}</span>
            </td>
            <td class="px-6 py-4">
              <span class="text-sm font-body" :class="product.inventoryCount < 10 ? 'text-red-600' : 'text-[#757681]'">
                {{ product.inventoryCount }} units
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <button class="w-8 h-8 flex items-center justify-center text-[#757681] hover:text-[#000622] hover:bg-[#edeeef] transition-colors">
                    <MoreHorizontal class="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-40">
                  <DropdownMenuItem as-child>
                    <NuxtLink :to="`/admin/products/${product.id}`" class="flex items-center gap-2">
                      <Eye class="w-4 h-4" />View Details
                    </NuxtLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem as-child>
                    <NuxtLink :to="`/admin/products/${product.id}/edit`" class="flex items-center gap-2">
                      <Pencil class="w-4 h-4" />Edit
                    </NuxtLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- Table Pagination -->
      <div v-if="totalPages > 1" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-[#c5c6d1]/20 bg-[#f8f9fa]">
        <p class="text-xs font-body text-[#757681]">Showing {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredProducts.length) }} of {{ filteredProducts.length }} products</p>
        <div class="flex items-center gap-1">
          <button @click="currentPage--" :disabled="currentPage === 1" class="w-8 h-8 flex items-center justify-center border border-[#c5c6d1] text-[#757681] hover:bg-[#edeeef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-label font-bold">&lsaquo;</button>
          <template v-for="p in visiblePages" :key="String(p)">
            <span v-if="p === '...'" class="w-8 h-8 flex items-center justify-center text-[#c5c6d1] text-xs">…</span>
            <button v-else @click="currentPage = p" class="w-8 h-8 flex items-center justify-center border text-xs font-label font-bold transition-colors" :class="currentPage === p ? 'bg-[#000622] text-white border-[#000622]' : 'border-[#c5c6d1] text-[#757681] hover:bg-[#edeeef]'">{{ p }}</button>
          </template>
          <button @click="currentPage++" :disabled="currentPage === totalPages" class="w-8 h-8 flex items-center justify-center border border-[#c5c6d1] text-[#757681] hover:bg-[#edeeef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-label font-bold">&rsaquo;</button>
        </div>
      </div>
    </div>
  </div>
</template>
