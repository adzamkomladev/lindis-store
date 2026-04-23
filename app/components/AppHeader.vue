<script setup lang="ts">
import { Menu, X } from 'lucide-vue-next'

const { cartCount } = useCart()
const mobileMenuOpen = ref(false)
const route = useRoute()
const isScrolled = ref(false)

const navLinks = [
  { label: 'Shop All', to: '/products' },
  { label: 'Home', to: '/' },
]

watch(() => route.path, () => {
  mobileMenuOpen.value = false
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
        <button
          class="hidden md:block transition-opacity hover:opacity-70 text-[#000622]"
          aria-label="Search"
        >
          <span class="material-symbols-outlined" style="font-size:22px">search</span>
        </button>

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
