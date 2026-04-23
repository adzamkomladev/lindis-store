<script setup lang="ts">
import { Tag, Plus, Trash2, Edit, Loader2, X, Search } from 'lucide-vue-next'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

definePageMeta({ layout: 'admin' })

const { data: codes, refresh } = await useFetch<any[]>('/api/admin/discount-codes')
const { showSuccess, showError, showConfirm } = useAlertDialog()

const showDialog = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const editingId = ref<string | null>(null)

const defaultForm = {
  code: '', description: '', type: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
  value: 10, minOrderAmount: null as number | null, minQuantity: null as number | null,
  maxUses: null as number | null, productId: null as number | null, categoryName: null as string | null,
  startsAt: null as string | null, expiresAt: null as string | null, isActive: true,
}

const form = reactive({ ...defaultForm })

const openCreate = () => { Object.assign(form, defaultForm); isEditing.value = false; editingId.value = null; showDialog.value = true }

const openEdit = (code: any) => {
  Object.assign(form, {
    code: code.code, description: code.description || '', type: code.type,
    value: code.type === 'fixed' ? code.value / 100 : code.value,
    minOrderAmount: code.minOrderAmount ? code.minOrderAmount / 100 : null,
    minQuantity: code.minQuantity, maxUses: code.maxUses, productId: code.productId,
    categoryName: code.categoryName,
    startsAt: code.startsAt ? new Date(code.startsAt).toISOString().slice(0, 16) : null,
    expiresAt: code.expiresAt ? new Date(code.expiresAt).toISOString().slice(0, 16) : null,
    isActive: code.isActive,
  })
  isEditing.value = true; editingId.value = code.id; showDialog.value = true
}

const saveCode = async () => {
  isSaving.value = true
  try {
    const payload = { ...form, startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null, expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null }
    if (isEditing.value && editingId.value) {
      await $fetch(`/api/admin/discount-codes/${editingId.value}`, { method: 'PUT', body: payload })
      showSuccess('Updated', 'Discount code updated successfully')
    } else {
      await $fetch('/api/admin/discount-codes', { method: 'POST', body: payload })
      showSuccess('Created', 'Discount code created successfully')
    }
    showDialog.value = false; refresh()
  } catch (err: any) { showError('Error', err.data?.message || 'Failed to save') }
  finally { isSaving.value = false }
}

const deleteCode = async (id: string) => {
  const ok = await showConfirm('Delete Code', 'Are you sure you want to delete this discount code?')
  if (!ok) return
  try { await $fetch(`/api/admin/discount-codes/${id}`, { method: 'DELETE' }); refresh() }
  catch { showError('Error', 'Failed to delete') }
}

const formatValue = (code: any) => {
  if (code.type === 'percentage') return `${code.value}% off`
  if (code.type === 'fixed') return `₵${(code.value / 100).toFixed(2)} off`
  return 'Free shipping'
}
const formatDate = (d: string | null) => d ? new Intl.DateTimeFormat('en-GH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d)) : '—'
const isExpired = (code: any) => code.expiresAt && new Date(code.expiresAt) < new Date()

// Search + Pagination
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 15

const filteredCodes = computed(() => {
  if (!codes.value) return []
  if (!searchQuery.value) return codes.value
  const q = searchQuery.value.toLowerCase()
  return codes.value.filter((c: any) =>
    c.code?.toLowerCase().includes(q) ||
    c.description?.toLowerCase().includes(q)
  )
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredCodes.value.length / pageSize)))
const paginatedCodes = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredCodes.value.slice(start, start + pageSize)
})

watch(searchQuery, () => { currentPage.value = 1 })

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
  <div class="max-w-4xl space-y-6 py-6">

    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-[#475d92] font-label font-bold uppercase tracking-[0.2em] text-xs mb-1">Promotions</p>
        <h2 class="font-headline font-black text-[#000622] tracking-tighter uppercase text-2xl">Discount Codes</h2>
      </div>
      <div class="flex items-center gap-3">
        <!-- Search -->
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757681]" />
          <input
            v-model="searchQuery"
            placeholder="SEARCH CODES"
            class="pl-9 pr-4 py-2.5 border border-[#c5c6d1] bg-[#f8f9fa] text-xs font-label font-bold uppercase tracking-widest focus:outline-none focus:border-[#000622] transition-colors placeholder:text-[#c5c6d1] w-48"
          />
        </div>
        <button @click="openCreate" class="monolith-gradient px-5 py-2.5 text-white font-label font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Plus class="w-3.5 h-3.5" />Create Code
        </button>
      </div>
    </div>

    <!-- Codes list -->
    <div class="bg-white border border-[#c5c6d1]/20">
      <div v-if="!filteredCodes?.length" class="py-16 text-center">
        <div class="w-14 h-14 bg-[#f3f4f5] flex items-center justify-center mx-auto mb-4">
          <Tag class="w-7 h-7 text-[#c5c6d1]" />
        </div>
        <h3 class="font-headline font-bold text-[#000622] uppercase tracking-tight mb-2">
          {{ searchQuery ? 'No codes found' : 'No discount codes yet' }}
        </h3>
        <p class="text-sm text-[#757681] font-body">
          {{ searchQuery ? 'Try a different search term' : 'Create your first code to start offering promotions.' }}
        </p>
      </div>

      <div v-else class="divide-y divide-[#c5c6d1]/10">
        <div v-for="code in paginatedCodes" :key="code.id" class="flex items-center gap-4 px-6 py-4 hover:bg-[#f8f9fa] transition-colors">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 flex-wrap">
              <span class="font-mono font-black text-[#000622] text-sm tracking-widest uppercase">{{ code.code }}</span>
              <span :class="code.isActive && !isExpired(code) ? 'bg-emerald-500/10 text-emerald-700' : 'bg-[#edeeef] text-[#757681]'"
                class="px-2 py-0.5 text-[10px] font-label font-bold uppercase tracking-widest">
                {{ isExpired(code) ? 'Expired' : code.isActive ? 'Active' : 'Inactive' }}
              </span>
              <span class="px-2 py-0.5 border border-[#c5c6d1] text-[10px] font-label font-bold uppercase tracking-widest text-[#757681]">
                {{ code.type.replace('_', ' ') }}
              </span>
            </div>
            <div class="flex items-center gap-4 mt-1.5 text-xs flex-wrap">
              <span class="font-label font-bold text-[#475d92]">{{ formatValue(code) }}</span>
              <span class="text-[#757681] font-body">{{ code.usedCount }}{{ code.maxUses ? `/${code.maxUses}` : '' }} uses</span>
              <span v-if="code.expiresAt" class="text-[#757681] font-body">Expires: {{ formatDate(code.expiresAt) }}</span>
              <span v-if="code.description" class="text-[#757681] font-body">{{ code.description }}</span>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button @click="openEdit(code)" class="w-8 h-8 flex items-center justify-center text-[#757681] hover:text-[#000622] hover:bg-[#edeeef] transition-colors">
              <Edit class="w-3.5 h-3.5" />
            </button>
            <button @click="deleteCode(code.id)" class="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-[#c5c6d1]/20 bg-[#f8f9fa]">
        <p class="text-xs font-body text-[#757681]">Showing {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredCodes.length) }} of {{ filteredCodes.length }} codes</p>
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

    <!-- Create / Edit Dialog -->
    <Teleport to="body">
      <div v-if="showDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000622]/40 backdrop-blur-sm">
        <div class="w-full max-w-lg bg-white border border-[#c5c6d1]/20 shadow-2xl max-h-[90vh] overflow-y-auto">

          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-[#c5c6d1]/15">
            <div>
              <p class="text-[#475d92] font-label font-bold uppercase tracking-[0.2em] text-xs mb-0.5">Promotions</p>
              <h3 class="font-headline font-bold text-[#000622] uppercase tracking-tight">{{ isEditing ? 'Edit' : 'Create' }} Code</h3>
            </div>
            <button @click="showDialog = false" class="w-8 h-8 flex items-center justify-center text-[#757681] hover:text-[#000622] hover:bg-[#edeeef] transition-colors">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="p-6 space-y-5">
            <!-- Code -->
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Code <span class="text-red-500">*</span></label>
              <input v-model="form.code" placeholder="e.g. SUMMER20" :disabled="isEditing"
                class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-4 py-2.5 text-sm font-mono uppercase tracking-widest focus:outline-none focus:border-[#000622] transition-colors disabled:opacity-50" />
            </div>

            <!-- Description -->
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Description</label>
              <input v-model="form.description" placeholder="Short description (optional)"
                class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-4 py-2.5 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
            </div>

            <!-- Type + Value -->
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Type <span class="text-red-500">*</span></label>
                <ClientOnly>
                  <Select v-model="form.type">
                    <SelectTrigger class="h-10 border-[#c5c6d1] text-xs font-label uppercase tracking-widest"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="free_shipping">Free Shipping</SelectItem>
                    </SelectContent>
                  </Select>
                </ClientOnly>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">
                  Value <span class="text-[#c5c6d1] font-normal normal-case tracking-normal">{{ form.type === 'percentage' ? '(%)' : form.type === 'fixed' ? '(GHS)' : '' }}</span>
                </label>
                <input v-model.number="form.value" type="number" min="0" :max="form.type === 'percentage' ? 100 : undefined"
                  :disabled="form.type === 'free_shipping'"
                  class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-4 py-2.5 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors disabled:opacity-50" />
              </div>
            </div>

            <div class="border-t border-[#c5c6d1]/20 pt-5">
              <p class="text-xs font-bold uppercase tracking-widest text-[#000622] font-label mb-4">Restrictions <span class="text-[#c5c6d1] font-normal normal-case tracking-normal">(optional)</span></p>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label class="text-xs font-body text-[#757681] block">Min Order (GHS)</label>
                  <input v-model.number="form.minOrderAmount" type="number" min="0" placeholder="None"
                    class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-3 py-2 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-body text-[#757681] block">Min Quantity</label>
                  <input v-model.number="form.minQuantity" type="number" min="0" placeholder="None"
                    class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-3 py-2 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-body text-[#757681] block">Max Uses</label>
                  <input v-model.number="form.maxUses" type="number" min="1" placeholder="Unlimited"
                    class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-3 py-2 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-body text-[#757681] block">Category</label>
                  <input v-model="form.categoryName" placeholder="e.g. drinkware"
                    class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-3 py-2 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
                </div>
              </div>
            </div>

            <div class="border-t border-[#c5c6d1]/20 pt-5">
              <p class="text-xs font-bold uppercase tracking-widest text-[#000622] font-label mb-4">Validity Period <span class="text-[#c5c6d1] font-normal normal-case tracking-normal">(optional)</span></p>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label class="text-xs font-body text-[#757681] block">Starts At</label>
                  <input v-model="form.startsAt" type="datetime-local" class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-3 py-2 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-body text-[#757681] block">Expires At</label>
                  <input v-model="form.expiresAt" type="datetime-local" class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-3 py-2 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
                </div>
              </div>
            </div>

            <div class="border-t border-[#c5c6d1]/20 pt-5 flex items-center justify-between">
              <div>
                <p class="text-xs font-bold uppercase tracking-widest text-[#000622] font-label">Active</p>
                <p class="text-xs text-[#757681] font-body mt-0.5">Show this code to customers</p>
              </div>
              <Switch v-model="form.isActive" />
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button @click="showDialog = false" class="flex-1 py-3 border border-[#c5c6d1] text-[#000622] font-label font-bold uppercase text-xs tracking-widest hover:bg-[#edeeef] transition-colors">
                Cancel
              </button>
              <button @click="saveCode" :disabled="isSaving" class="flex-1 py-3 monolith-gradient text-white font-label font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 disabled:opacity-60">
                <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
                {{ isSaving ? 'Saving...' : isEditing ? 'Update' : 'Create' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
