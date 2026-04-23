<script setup lang="ts">
import { Menu, X, User, LogOut, Package } from 'lucide-vue-next'

const { cartCount } = useCart()
const { loggedIn, isCustomer, user, logout } = useAuth()
const mobileMenuOpen = ref(false)
const route = useRoute()
const isScrolled = ref(false)
const accountMenuOpen = ref(false)

const navLinks = [
  { label: 'Shop All', to: '/products' },
  { label: 'Home', to: '/' },
]

watch(() => route.path, () => {
  mobileMenuOpen.value = false
  accountMenuOpen.value = false
})

watch(mobileMenuOpen, (open) => {
  if (import.meta.client) {
    document.body.style.overflow = open ? 'hidden' : ''
  }
})

onMounted(() => {
  if (import.meta.client) {
    const handleScroll = () => {
      isScrolled.value = window.scrollY > 10
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    onUnmounted(() => window.removeEventListener('scroll', handleScroll))
  }
})

// Close account menu on click outside
onMounted(() => {
  if (!import.meta.client) return
  const closeAccount = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('[data-account-menu]')) {
      accountMenuOpen.value = false
    }
  }
  document.addEventListener('click', closeAccount)
  onUnmounted(() => document.removeEventListener('click', closeAccount))
})
</script>

<template>
  <header
    class="w-full transition-all duration-300"
    :class="isScrolled ? 'glass-nav shadow-sm' : 'glass-nav'"
  >
    <div class="flex justify-between items-center w-full px-8 py-5 max-w-screen-2xl mx-auto">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center group shrink-0">
        <NuxtImg
          src="/img/normal-logo.png"
          alt="Lindi's Store Logo"
          class="h-14 md:h-18 w-auto block transition-all duration-300"
        />
      </NuxtLink>

      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center gap-8">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="font-headline tracking-tight uppercase text-sm font-bold transition-colors pb-1"
          :class="[
            route.path === link.to
              ? 'text-[#000622] border-b-2 border-[#000622]'
              : 'text-slate-500 hover:text-[#000622]'
          ]"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- Right: Icons -->
      <div class="flex items-center gap-5">
        <!-- Search -->
        <NuxtLink
          to="/search"
          class="hidden md:block transition-opacity hover:opacity-70 text-[#000622]"
          aria-label="Search"
        >
          <span class="material-symbols-outlined" style="font-size:22px">search</span>
        </NuxtLink>

        <!-- Account -->
        <div v-if="isCustomer && loggedIn" class="hidden md:block relative" data-account-menu>
          <button
            @click="accountMenuOpen = !accountMenuOpen"
            class="flex items-center gap-2 transition-opacity hover:opacity-70 text-[#000622]"
            aria-label="Account"
          >
            <span class="material-symbols-outlined" style="font-size:22px">person</span>
          </button>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1"
          >
            <div
              v-if="accountMenuOpen"
              class="absolute right-0 top-full mt-3 w-56 bg-white border border-outline-variant/20 shadow-xl rounded-lg z-50 py-2"
            >
              <div class="px-4 py-3 border-b border-outline-variant/10">
                <p class="text-sm font-bold text-[#000622] font-body">{{ user?.name || user?.email }}</p>
                <p class="text-xs text-slate-500 font-body truncate">{{ user?.email }}</p>
              </div>
              <NuxtLink
                to="/account"
                class="flex items-center gap-3 px-4 py-2.5 text-sm text-[#000622] hover:bg-slate-50 transition-colors font-body"
                @click="accountMenuOpen = false"
              >
                <User class="w-4 h-4" />
                My Account
              </NuxtLink>
              <NuxtLink
                to="/account/orders"
                class="flex items-center gap-3 px-4 py-2.5 text-sm text-[#000622] hover:bg-slate-50 transition-colors font-body"
                @click="accountMenuOpen = false"
              >
                <Package class="w-4 h-4" />
                My Orders
              </NuxtLink>
              <button
                @click="logout"
                class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-body text-left"
              >
                <LogOut class="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </Transition>
        </div>

        <NuxtLink
          v-else
          to="/login"
          class="hidden md:block transition-opacity hover:opacity-70 text-[#000622]"
          aria-label="Login"
        >
          <span class="material-symbols-outlined" style="font-size:22px">person</span>
        </NuxtLink>

        <!-- Cart -->
        <NuxtLink
          to="/cart"
          class="relative transition-opacity hover:opacity-70 text-[#000622]"
          aria-label="Shopping cart"
        >
          <span class="material-symbols-outlined" style="font-size:22px">shopping_bag</span>
          <span
            v-if="cartCount > 0"
            class="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#000622] text-[9px] font-bold text-white"
          >
            {{ cartCount > 9 ? '9+' : cartCount }}
          </span>
        </NuxtLink>

        <!-- Mobile menu button -->
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden transition-opacity hover:opacity-70 text-[#000622]"
          aria-label="Menu"
        >
          <X v-if="mobileMenuOpen" class="h-5 w-5" />
          <Menu v-else class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- Mobile overlay -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mobileMenuOpen"
        class="md:hidden fixed inset-0 top-[72px] bg-black/20 backdrop-blur-sm z-40"
        @click="mobileMenuOpen = false"
      />
    </Transition>

    <!-- Mobile Menu -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="mobileMenuOpen" class="md:hidden absolute top-full left-0 right-0 glass-nav border-b border-outline-variant/20 shadow-xl z-50">
        <nav class="px-8 py-6 flex flex-col gap-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center justify-between py-3.5 text-sm font-headline font-bold uppercase tracking-tight text-[#000622]/70 hover:text-[#000622] transition-colors border-b border-outline-variant/10 last:border-0"
            :class="{ 'text-[#000622]': route.path === link.to }"
          >
            {{ link.label }}
          </NuxtLink>

          <template v-if="isCustomer && loggedIn">
            <NuxtLink
              to="/account"
              class="flex items-center justify-between py-3.5 text-sm font-headline font-bold uppercase tracking-tight text-[#000622]/70 hover:text-[#000622] transition-colors border-b border-outline-variant/10"
            >
              My Account
            </NuxtLink>
            <NuxtLink
              to="/account/orders"
              class="flex items-center justify-between py-3.5 text-sm font-headline font-bold uppercase tracking-tight text-[#000622]/70 hover:text-[#000622] transition-colors border-b border-outline-variant/10"
            >
              My Orders
            </NuxtLink>
            <button
              @click="logout"
              class="flex items-center justify-between py-3.5 text-sm font-headline font-bold uppercase tracking-tight text-red-600 hover:text-red-700 transition-colors"
            >
              Sign Out
            </button>
          </template>
          <template v-else>
            <NuxtLink
              to="/login"
              class="flex items-center justify-between py-3.5 text-sm font-headline font-bold uppercase tracking-tight text-[#000622]/70 hover:text-[#000622] transition-colors border-b border-outline-variant/10"
            >
              Login / Register
            </NuxtLink>
          </template>

          <NuxtLink
            to="/cart"
            class="flex items-center justify-between py-3.5 text-sm font-headline font-bold uppercase tracking-tight text-[#000622]/70 hover:text-[#000622] transition-colors mt-1"
          >
            <span class="flex items-center gap-3">
              <span class="material-symbols-outlined text-lg">shopping_bag</span>
              Shopping Cart
            </span>
            <span v-if="cartCount > 0" class="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#000622] text-[10px] font-bold text-white px-1">
              {{ cartCount }}
            </span>
          </NuxtLink>
        </nav>
      </div>
    </Transition>
  </header>
</template>
