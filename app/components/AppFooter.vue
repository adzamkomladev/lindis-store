<script setup lang="ts">
const currentYear = new Date().getFullYear()

const footerSections = {
  explore: [
    { label: 'Shop All', to: '/products' },
    { label: 'New Arrivals', to: '/products?sort=newest' },
    { label: 'Best Sellers', to: '/products?sort=popular' },
    { label: 'Search', to: '/search' },
  ],
  support: [
    { label: 'Shipping & Returns', to: '/shipping-returns' },
    { label: 'Warranty', to: '/warranty' },
    { label: 'Contact', to: '/contact' },
    { label: 'FAQ', to: '/faq' },
  ],
}
</script>

<template>
  <footer class="w-full pt-20 pb-10 bg-slate-100 border-t border-outline-variant/15">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-12 px-8 max-w-screen-2xl mx-auto">
      <!-- Brand Column -->
      <div class="flex flex-col gap-6">
        <NuxtLink to="/" class="inline-block">
          <span class="text-xl font-black tracking-tighter text-[#000622] uppercase font-headline">EFFERO</span>
        </NuxtLink>
        <p class="font-body text-sm leading-relaxed text-slate-500 max-w-xs">
          Premium hydration essentials crafted in Ghana. Sustainable, beautiful, and built to last.
        </p>
        <div class="flex items-center gap-4">
          <a href="#" aria-label="Instagram" class="text-slate-400 hover:text-[#000622] transition-colors">
            <span class="material-symbols-outlined text-xl">photo_camera</span>
          </a>
          <a href="#" aria-label="Twitter" class="text-slate-400 hover:text-[#000622] transition-colors">
            <span class="material-symbols-outlined text-xl">alternate_email</span>
          </a>
          <a href="#" aria-label="Facebook" class="text-slate-400 hover:text-[#000622] transition-colors">
            <span class="material-symbols-outlined text-xl">public</span>
          </a>
        </div>
      </div>

      <!-- Explore Links -->
      <div class="flex flex-col gap-4">
        <h5 class="font-headline font-bold text-xs uppercase tracking-widest text-[#000622]">Explore</h5>
        <nav class="flex flex-col gap-3">
          <NuxtLink
            v-for="link in footerSections.explore"
            :key="link.to"
            :to="link.to"
            class="font-body text-sm text-slate-500 hover:underline decoration-1 underline-offset-4 transition-colors"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>

      <!-- Support Links -->
      <div class="flex flex-col gap-4">
        <h5 class="font-headline font-bold text-xs uppercase tracking-widest text-[#000622]">Support</h5>
        <nav class="flex flex-col gap-3">
          <NuxtLink
            v-for="link in footerSections.support"
            :key="link.to"
            :to="link.to"
            class="font-body text-sm text-slate-500 hover:underline decoration-1 underline-offset-4 transition-colors"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>

      <!-- Journal / Newsletter -->
      <div class="flex flex-col gap-4">
        <h5 class="font-headline font-bold text-xs uppercase tracking-widest text-[#000622]">Journal</h5>
        <p class="font-body text-sm text-slate-500 leading-relaxed">
          Join our bulletin for exclusive collection drops and technical insights.
        </p>
        <FooterNewsletter />
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="mt-16 px-8 max-w-screen-2xl mx-auto border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="font-body text-sm text-slate-500 text-center md:text-left">
        © {{ currentYear }} Lindi's Store. Engineered for Life.
      </p>
      <div class="flex items-center gap-6">
        <NuxtLink to="/privacy-policy" class="font-body text-sm text-slate-500 hover:text-[#000622] transition-colors">Privacy Policy</NuxtLink>
        <NuxtLink to="/terms-of-service" class="font-body text-sm text-slate-500 hover:text-[#000622] transition-colors">Terms of Service</NuxtLink>
      </div>
    </div>
  </footer>
</template>
