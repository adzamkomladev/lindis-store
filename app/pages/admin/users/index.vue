<script setup lang="ts">
import { Plus, MoreHorizontal, Users, Search, Trash2, Key, Shield, User as UserIcon, Copy, Check } from 'lucide-vue-next'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'

definePageMeta({ layout: 'admin' })

interface User { id: string; email: string; name: string | null; role: 'admin' | 'customer'; createdAt: string }

const { data: users, pending, refresh } = await useFetch<User[]>('/api/admin/users')
const searchQuery = ref('')
const roleFilter = ref('all')
const isAddUserOpen = ref(false)
const isLoading = ref(false)
const showPassword = ref(false)
const generatedPassword = ref('')
const createdUserEmail = ref('')
const newUser = ref({ email: '', name: '', role: 'customer' as 'admin' | 'customer' })

const resetForm = () => { newUser.value = { email: '', name: '', role: 'customer' }; showPassword.value = false; generatedPassword.value = ''; createdUserEmail.value = '' }

const filteredUsers = computed(() => {
  if (!users.value) return []
  let r = users.value
  if (roleFilter.value !== 'all') r = r.filter(u => u.role === roleFilter.value)
  if (searchQuery.value) { const q = searchQuery.value.toLowerCase(); r = r.filter(u => u.email.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q)) }
  return r
})

const userStats = computed(() => {
  if (!users.value) return { total: 0, admins: 0, customers: 0 }
  return { total: users.value.length, admins: users.value.filter(u => u.role === 'admin').length, customers: users.value.filter(u => u.role === 'customer').length }
})

const { showError, confirm: confirmDialog } = useAlertDialog()
const formatDate = (d: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))

const handleAddUser = async () => {
  if (!newUser.value.email || !newUser.value.name) return
  isLoading.value = true
  try {
    const r = await $fetch('/api/admin/users', { method: 'POST', body: newUser.value })
    generatedPassword.value = r.temporaryPassword; createdUserEmail.value = r.user.email; showPassword.value = true
    await refresh()
  } catch (e: any) { showError('Failed to Create User', e.data?.message || 'An error occurred') }
  finally { isLoading.value = false }
}

const handleDeleteUser = async (user: User) => {
  const ok = await confirmDialog({ title: 'Delete User', description: `Delete ${user.email}? Cannot be undone.`, confirmText: 'Delete', variant: 'error' })
  if (!ok) return
  try { await $fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' }); await refresh() }
  catch (e: any) { showError('Failed', e.data?.message || 'Error') }
}

const handleResetPassword = async (user: User) => {
  const ok = await confirmDialog({ title: 'Reset Password', description: `Reset for ${user.email}?`, confirmText: 'Reset', variant: 'warning' })
  if (!ok) return
  try { const r = await $fetch(`/api/admin/users/${user.id}/reset-password`, { method: 'POST' }); generatedPassword.value = r.temporaryPassword; createdUserEmail.value = user.email; showPassword.value = true; isAddUserOpen.value = true }
  catch (e: any) { showError('Failed', e.data?.message || 'Error') }
}

const handleToggleRole = async (user: User) => {
  const nr = user.role === 'admin' ? 'customer' : 'admin'
  const ok = await confirmDialog({ title: 'Change Role', description: `Change ${user.email} to ${nr}?`, confirmText: 'Change', variant: 'warning' })
  if (!ok) return
  try { await $fetch(`/api/admin/users/${user.id}`, { method: 'PUT', body: { role: nr } }); await refresh() }
  catch (e: any) { showError('Failed', e.data?.message || 'Error') }
}

const copied = ref(false)
const copyPassword = async () => { await navigator.clipboard.writeText(generatedPassword.value); copied.value = true; setTimeout(() => copied.value = false, 2000) }
const closeSheet = () => { isAddUserOpen.value = false; resetForm() }

// Pagination
const currentPage = ref(1)
const pageSize = 20

const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize)))
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredUsers.value.slice(start, start + pageSize)
})

watch([searchQuery, roleFilter], () => { currentPage.value = 1 })

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
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-[#475d92] font-label font-bold uppercase tracking-[0.2em] text-xs mb-1">Access Control</p>
        <h2 class="font-headline font-black text-[#000622] tracking-tighter uppercase text-2xl">Users</h2>
      </div>
      <button @click="isAddUserOpen = true; resetForm()" class="monolith-gradient px-5 py-2.5 text-white font-label font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:opacity-90 transition-opacity w-fit">
        <Plus class="w-3.5 h-3.5" />Add User
      </button>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div v-for="(s,i) in [{ label:'Total', value:userStats.total, accent:'bg-[#adc3fe] text-[#394f83]', icon:Users }, { label:'Admins', value:userStats.admins, accent:'bg-violet-500/10 text-violet-600', icon:Shield }, { label:'Customers', value:userStats.customers, accent:'bg-emerald-500/10 text-emerald-600', icon:UserIcon }]" :key="i" class="bg-white border border-[#c5c6d1]/20 p-5 flex items-center gap-4">
        <div :class="[s.accent,'p-2.5']"><component :is="s.icon" class="w-4 h-4" /></div>
        <div>
          <p class="font-headline font-black text-[#000622] tracking-tighter text-2xl">{{ s.value }}</p>
          <p class="text-xs font-label font-bold uppercase tracking-widest text-[#757681] mt-0.5">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white border border-[#c5c6d1]/20 p-4 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757681]" />
        <input v-model="searchQuery" placeholder="SEARCH USERS" class="w-full pl-9 pr-4 py-2.5 border border-[#c5c6d1] bg-[#f8f9fa] text-xs font-label font-bold uppercase tracking-widest focus:outline-none focus:border-[#000622] transition-colors placeholder:text-[#c5c6d1]" />
      </div>
      <Select v-model="roleFilter">
        <SelectTrigger class="w-full sm:w-44 h-10 border-[#c5c6d1] text-xs font-label uppercase tracking-widest">
          <SelectValue placeholder="All Roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="admin">Admins</SelectItem>
          <SelectItem value="customer">Customers</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="bg-white border border-[#c5c6d1]/20 overflow-hidden">
      <div v-if="pending" class="p-6 space-y-3">
        <div v-for="i in 5" :key="i" class="animate-pulse h-4 bg-[#edeeef]" />
      </div>
      <table v-else class="w-full">
        <thead>
          <tr class="border-b border-[#c5c6d1]/20 bg-[#f8f9fa]">
            <th v-for="h in ['User','Role','Joined','']" :key="h" class="px-6 py-3 text-[10px] font-label font-bold uppercase tracking-widest text-[#757681] text-left">{{ h }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#c5c6d1]/10">
          <tr v-if="!filteredUsers.length"><td colspan="4" class="px-6 py-16 text-center"><Users class="w-10 h-10 text-[#c5c6d1] mx-auto mb-3" /><p class="text-sm text-[#757681] font-body">No users found</p></td></tr>
          <tr v-for="user in paginatedUsers" :key="user.id" class="hover:bg-[#f8f9fa] transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-[#000622] flex items-center justify-center shrink-0">
                  <span class="text-xs font-bold text-[#b1c6ff] font-label">{{ (user.name || user.email)[0].toUpperCase() }}</span>
                </div>
                <div>
                  <p class="font-label font-bold text-xs uppercase tracking-wide text-[#000622]">{{ user.name || 'No name' }}</p>
                  <p class="text-xs text-[#757681] font-body">{{ user.email }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span :class="user.role==='admin' ? 'bg-violet-500/10 text-violet-700' : 'bg-[#adc3fe] text-[#394f83]'" class="px-2.5 py-1 text-[10px] font-label font-bold uppercase tracking-widest inline-flex items-center gap-1.5">
                <Shield v-if="user.role==='admin'" class="w-3 h-3" /><UserIcon v-else class="w-3 h-3" />
                {{ user.role === 'admin' ? 'Admin' : 'Customer' }}
              </span>
            </td>
            <td class="px-6 py-4 text-xs text-[#757681] font-body">{{ formatDate(user.createdAt) }}</td>
            <td class="px-6 py-4">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <button class="w-8 h-8 flex items-center justify-center text-[#757681] hover:text-[#000622] hover:bg-[#edeeef] transition-colors">
                    <MoreHorizontal class="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="handleToggleRole(user)"><Shield class="w-4 h-4 mr-2" />{{ user.role==='admin' ? 'Make Customer' : 'Make Admin' }}</DropdownMenuItem>
                  <DropdownMenuItem @click="handleResetPassword(user)"><Key class="w-4 h-4 mr-2" />Reset Password</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @click="handleDeleteUser(user)" class="text-red-600 focus:text-red-600"><Trash2 class="w-4 h-4 mr-2" />Delete User</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-[#c5c6d1]/20 bg-[#f8f9fa]">
        <p class="text-xs font-body text-[#757681]">Showing {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredUsers.length) }} of {{ filteredUsers.length }} users</p>
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

    <Sheet :open="isAddUserOpen" @update:open="val => { if (!val) closeSheet() }">
      <SheetContent class="sm:max-w-md border-[#c5c6d1]/20 bg-white">
        <SheetHeader>
          <SheetTitle class="font-headline font-bold text-[#000622] uppercase tracking-tight">{{ showPassword ? 'User Created' : 'Add New User' }}</SheetTitle>
          <SheetDescription class="text-xs text-[#757681] font-body">{{ showPassword ? 'Save these credentials before closing.' : 'A random password will be generated.' }}</SheetDescription>
        </SheetHeader>
        <div v-if="showPassword" class="mt-6 space-y-5">
          <div class="p-4 bg-emerald-500/10 border-l-2 border-emerald-500">
            <p class="font-label font-bold text-xs uppercase tracking-widest text-emerald-700 mb-1">Success</p>
            <p class="text-xs text-emerald-600 font-body">Save these credentials before closing.</p>
          </div>
          <div><p class="text-xs font-label font-bold uppercase tracking-widest text-[#757681] mb-1">Email</p><p class="font-body text-sm text-[#000622]">{{ createdUserEmail }}</p></div>
          <div>
            <p class="text-xs font-label font-bold uppercase tracking-widest text-[#757681] mb-1">Temporary Password</p>
            <div class="flex items-center gap-2 mt-1">
              <code class="flex-1 bg-[#f3f4f5] px-3 py-2 font-mono text-sm text-[#000622]">{{ generatedPassword }}</code>
              <button @click="copyPassword" class="w-9 h-9 border border-[#c5c6d1] flex items-center justify-center hover:bg-[#edeeef] transition-colors">
                <Check v-if="copied" class="w-4 h-4 text-emerald-600" /><Copy v-else class="w-4 h-4 text-[#757681]" />
              </button>
            </div>
          </div>
          <SheetFooter><button @click="closeSheet" class="w-full py-3 monolith-gradient text-white font-label font-bold uppercase text-xs tracking-widest">Done</button></SheetFooter>
        </div>
        <form v-else @submit.prevent="handleAddUser" class="mt-6 space-y-5">
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Name</label>
            <input v-model="newUser.name" placeholder="John Doe" required class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-4 py-2.5 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Email</label>
            <input v-model="newUser.email" type="email" placeholder="john@example.com" required class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-4 py-2.5 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Role</label>
            <Select v-model="newUser.role">
              <SelectTrigger class="border-[#c5c6d1] h-10 text-xs font-label uppercase tracking-widest"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="customer">Customer</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
            </Select>
          </div>
          <div class="p-4 bg-amber-500/10 border-l-2 border-amber-500">
            <p class="font-label font-bold text-xs uppercase tracking-widest text-amber-700 mb-1">Auto Password</p>
            <p class="text-xs text-amber-600 font-body">A secure random password will be created. Save it.</p>
          </div>
          <SheetFooter class="flex gap-3">
            <button type="button" @click="closeSheet" class="flex-1 py-3 border border-[#c5c6d1] text-[#000622] font-label font-bold uppercase text-xs tracking-widest hover:bg-[#edeeef] transition-colors">Cancel</button>
            <button type="submit" :disabled="isLoading || !newUser.email || !newUser.name" class="flex-1 py-3 monolith-gradient text-white font-label font-bold uppercase text-xs tracking-widest disabled:opacity-60 flex items-center justify-center gap-2">
              <div v-if="isLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {{ isLoading ? 'Creating...' : 'Create User' }}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  </div>
</template>
