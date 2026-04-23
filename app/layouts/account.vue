<script setup lang="ts">
import { User, Package, MapPin, Heart, LogOut } from 'lucide-vue-next'

const route = useRoute()
const { logout, user } = useAuth()

const navItems = [
  { label: 'Overview', to: '/account', icon: User, exact: true },
  { label: 'My Orders', to: '/account/orders', icon: Package },
  { label: 'Addresses', to: '/account/addresses', icon: MapPin },
  { label: 'Wishlist', to: '/account/wishlist', icon: Heart },
]

const isActive = (item: typeof navItems[0]) => {
  if (item.exact) return route.path === item.to
  return route.path.startsWith(item.to)
}
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fa]">
    <div class="max-w-screen-2xl mx-auto px-8 py-12">
      <div class="flex flex-col lg:flex-row gap-12">
        <!-- Sidebar -->
        <aside class="w-full lg:w-64 shrink-0">
          <div class="bg-white border border-[#c5c6d1]/20 p-6">
            <div class="mb-6 pb-6 border-b border-[#c5c6d1]/15">
              <p class="font-headline font-bold text-[#000622] text-lg">{{ user?.name || 'My Account' }}</p>
              <p class="text-xs text-[#757681] font-body mt-1">{{ user?.email }}</p>
            </div>
            <nav class="space-y-1">
              <NuxtLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                class="flex items-center gap-3 px-4 py-3 text-sm font-body transition-colors"
                :class="isActive(item)
                  ? 'bg-[#000622] text-white font-bold'
                  : 'text-[#757681] hover:bg-[#f3f4f5] hover:text-[#000622]'"
              >
                <component :is="item.icon" class="w-4 h-4" />
                {{ item.label }}
              </NuxtLink>
              <button
                @click="logout"
                class="w-full flex items-center gap-3 px-4 py-3 text-sm font-body text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut class="w-4 h-4" />
                Sign Out
              </button>
            </nav>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 min-w-0">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
