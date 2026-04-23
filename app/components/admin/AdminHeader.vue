<script setup lang="ts">
import {
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Settings,
  CreditCard,
  Users,
  Tag
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const { logout } = useAuth()
const route = useRoute()
const mobileMenuOpen = ref(false)

const navItems = [
  { title: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
  { title: 'Products', icon: ShoppingBag, to: '/admin/products' },
  { title: 'Discounts', icon: Tag, to: '/admin/discount-codes' },
  { title: 'Orders', icon: ShoppingCart, to: '/admin/orders' },
  { title: 'Payments', icon: CreditCard, to: '/admin/payments' },
  { title: 'Users', icon: Users, to: '/admin/users' },
  { title: 'Settings', icon: Settings, to: '/admin/settings' },
]

async function handleLogout() {
  await logout()
  navigateTo('/admin/login')
}

watch(() => route.path, () => {
  mobileMenuOpen.value = false
})

const pageTitle = computed(() => {
  if (route.path === '/admin') return 'Dashboard'
  if (route.path.includes('/products/create')) return 'Add Product'
  if (route.path.includes('/products')) return 'Products'
  if (route.path.includes('/discount-codes')) return 'Discounts'
  if (route.path.includes('/orders')) return 'Orders'
  if (route.path.includes('/payments')) return 'Payments'
  if (route.path.includes('/users')) return 'Users'
  if (route.path.includes('/settings')) return 'Settings'
  return 'Admin'
})
</script>

<template>
  <!-- Top Bar -->
  <header class="h-14 border-b border-[#c5c6d1]/20 bg-[#f8f9fa] flex items-center justify-between px-6 sticky top-0 z-40">

    <!-- Left: Mobile Menu + Page Title -->
    <div class="flex items-center gap-4">
      <!-- Mobile menu toggle -->
      <button
        @click="mobileMenuOpen = !mobileMenuOpen"
        class="md:hidden text-[#757681] hover:text-[#000622] transition-colors"
        :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
      >
        <X v-if="mobileMenuOpen" class="w-5 h-5" />
        <Menu v-else class="w-5 h-5" />
      </button>

      <!-- Mobile Logo -->
      <div class="md:hidden">
        <NuxtImg src="/img/normal-logo.png" alt="Lindi's Store" class="h-7 w-auto" />
      </div>

      <!-- Desktop Page Title -->
      <h1 class="hidden md:block font-headline font-bold text-[#000622] tracking-tight text-lg uppercase">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-1">

      <!-- Search -->
      <button class="hidden md:flex w-8 h-8 items-center justify-center text-[#757681] hover:text-[#000622] transition-colors" aria-label="Search">
        <Search class="w-4 h-4" />
      </button>

      <!-- Notifications -->
      <button class="relative w-8 h-8 flex items-center justify-center text-[#757681] hover:text-[#000622] transition-colors" aria-label="Notifications">
        <Bell class="w-4 h-4" />
        <span class="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
      </button>

      <div class="w-px h-5 bg-[#c5c6d1]/40 mx-2 hidden md:block"></div>

      <!-- User Popover -->
      <Popover>
        <PopoverTrigger as-child>
          <button class="flex items-center gap-2 px-2 py-1 hover:bg-[#edeeef] transition-colors">
            <Avatar class="w-7 h-7">
              <AvatarFallback class="bg-[#000622] text-white text-[10px] font-bold font-label">AD</AvatarFallback>
            </Avatar>
            <span class="hidden md:block text-sm font-bold text-[#000622] font-label uppercase tracking-wide text-xs">Admin</span>
          </button>
        </PopoverTrigger>
        <PopoverContent class="w-44 p-2 bg-white border-[#c5c6d1]/20" align="end">
          <button
            @click="handleLogout"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-label font-bold uppercase tracking-wide text-xs"
          >
            <LogOut class="w-4 h-4" />
            Logout
          </button>
        </PopoverContent>
      </Popover>
    </div>
  </header>

  <!-- Mobile Navigation Drawer -->
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="mobileMenuOpen" class="fixed inset-0 z-30 md:hidden">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-[#000622]/60 backdrop-blur-sm" @click="mobileMenuOpen = false" />

      <!-- Drawer -->
      <div class="absolute left-0 top-14 bottom-0 w-72 bg-[#000622] border-r border-white/8 shadow-2xl">
        <nav class="p-4 space-y-0.5">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all"
            :class="route.path.startsWith(item.to) && (item.to !== '/admin' || route.path === '/admin')
              ? 'bg-white/10 text-white border-l-2 border-[#b1c6ff]'
              : 'text-white/50 hover:bg-white/6 hover:text-white'"
          >
            <component :is="item.icon" class="w-4 h-4 shrink-0" />
            <span class="font-label text-xs uppercase tracking-widest">{{ item.title }}</span>
          </NuxtLink>
        </nav>

        <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-white/8">
          <button
            @click="handleLogout"
            class="w-full flex items-center justify-center gap-2 py-3 border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors font-label text-xs uppercase tracking-widest"
          >
            <LogOut class="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
