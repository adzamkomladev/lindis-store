<script setup lang="ts">
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Settings,
  TrendingUp,
  CreditCard,
  Users,
  Tag,
  ChevronRight
} from 'lucide-vue-next'

const route = useRoute()
const { logout } = useAuth()

const navMain = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    to: '/admin',
    exact: true
  },
  {
    title: 'Products',
    icon: ShoppingBag,
    to: '/admin/products',
    items: [
      { title: 'All Products', to: '/admin/products' },
      { title: 'Add Product', to: '/admin/products/create' },
    ]
  },
  {
    title: 'Discounts',
    icon: Tag,
    to: '/admin/discount-codes',
  },
  {
    title: 'Orders',
    icon: ShoppingCart,
    to: '/admin/orders',
  },
  {
    title: 'Payments',
    icon: CreditCard,
    to: '/admin/payments',
  },
  {
    title: 'Users',
    icon: Users,
    to: '/admin/users',
  },
  {
    title: 'Settings',
    icon: Settings,
    to: '/admin/settings',
  }
]

const isActive = (item: typeof navMain[0]) => {
  if (item.exact) return route.path === item.to
  return route.path.startsWith(item.to)
}
</script>

<template>
  <aside class="fixed inset-y-0 left-0 z-50 hidden md:flex w-64 flex-col bg-background border-r border-outline-variant/20">

    <!-- Brand Wordmark -->
    <div class="h-20 flex flex-col justify-center px-6 border-b border-outline-variant/20">
      <NuxtLink to="/admin" class="flex flex-col">
        <span class="font-headline font-black text-on-surface text-lg uppercase tracking-tight">Lindi's Admin</span>
        <span class="font-label font-bold text-on-surface-variant text-[9px] uppercase tracking-widest mt-1">THE CULINARY EDITORIAL</span>
      </NuxtLink>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 pt-8 pb-4 space-y-2 overflow-y-auto">
      <div v-for="item in navMain" :key="item.to">
        <!-- Parent Item -->
        <NuxtLink
          :to="item.to"
          class="group relative flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg"
          :class="isActive(item)
            ? 'text-white bg-primary shadow-md shadow-primary/10'
            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'"
        >
          <component
            :is="item.icon"
            class="w-4 h-4 shrink-0 transition-colors"
            :class="isActive(item) ? 'text-white' : 'text-on-surface-variant group-hover:text-on-surface'"
          />
          <span class="flex-1 font-body text-sm">{{ item.title }}</span>
          <ChevronRight
            v-if="item.items"
            class="w-4 h-4 transition-transform text-outline-variant"
            :class="isActive(item) ? 'rotate-90 text-white/60' : ''"
          />
        </NuxtLink>

        <!-- Sub Items -->
        <div
          v-if="item.items && isActive(item)"
          class="ml-7 mt-1.5 mb-2 space-y-1 border-l-2 border-outline-variant/30 pl-3"
        >
          <NuxtLink
            v-for="subItem in item.items"
            :key="subItem.to"
            :to="subItem.to"
            class="block px-3 py-2 text-xs font-body transition-colors rounded-r-md"
            :class="route.path === subItem.to
              ? 'text-primary font-bold bg-surface-container-low/50'
              : 'text-on-surface-variant hover:text-on-surface'"
          >
            {{ subItem.title }}
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Footer Status Badge -->
    <div class="p-6">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-headline font-bold text-primary text-xs shrink-0">
          AU
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold text-on-surface font-body truncate">Admin User</p>
          <p class="text-[10px] text-on-surface-variant font-label uppercase tracking-widest mt-0.5">CHIEF EDITOR</p>
        </div>
      </div>
      <button @click="logout" class="mt-6 flex items-center gap-3 text-sm text-on-surface-variant hover:text-on-surface transition-colors font-body">
        <span class="material-symbols-outlined text-lg">logout</span>
        Logout
      </button>
    </div>
  </aside>
</template>
