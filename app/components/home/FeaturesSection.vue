<script setup lang="ts">
// Editorial product showcase / outdoor essentials section
</script>

<template>
  <section class="bg-[#f3f4f5] py-32">
    <div class="max-w-screen-2xl mx-auto px-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
        <!-- Image side with overlapping geometry blocks -->
        <div class="relative">
          <div class="aspect-[3/4] bg-[#edeeef] relative z-10 overflow-hidden">
            <NuxtImg
              src="/img/landing.jpg"
              alt="Lindi's Store product collection"
              class="w-full h-full object-cover"
            />
          </div>
          <!-- Decorative geometric overlays -->
          <div class="absolute -bottom-10 -right-10 w-2/3 aspect-square bg-white z-0 hidden md:block"></div>
          <div class="absolute top-10 -left-10 w-1/4 h-1/2 monolith-gradient z-0 hidden md:block"></div>
        </div>

        <!-- Text side -->
        <div class="flex flex-col gap-8">
          <span class="text-[#475d92] font-label font-bold uppercase tracking-[0.2em] text-xs">Innovation in Craft</span>
          <h2 class="font-headline font-black tracking-tighter leading-tight text-[#000622] uppercase" style="font-size: clamp(2.25rem, 4vw, 3.5rem)">
            OUTDOOR<br />ESSENTIALS
          </h2>
          <p class="text-[#454650] text-lg leading-relaxed font-body">
            Designed for the rugged paths. Our collection features reinforced bases and premium craftsmanship. Lightweight for the ascent, heavy on performance.
          </p>

          <!-- Feature icons -->
          <div class="grid grid-cols-2 gap-6">
            <div class="flex flex-col gap-2">
              <span class="material-symbols-outlined text-[#000622] text-2xl" style="font-variation-settings: 'FILL' 1">eco</span>
              <p class="font-headline font-bold text-sm uppercase tracking-tight">100% Recyclable</p>
              <p class="text-xs text-[#454650] font-body">Zero-waste packaging included.</p>
            </div>
            <div class="flex flex-col gap-2">
              <span class="material-symbols-outlined text-[#000622] text-2xl" style="font-variation-settings: 'FILL' 1">verified</span>
              <p class="font-headline font-bold text-sm uppercase tracking-tight">Lifetime Warranty</p>
              <p class="text-xs text-[#454650] font-body">Guaranteed for a generation.</p>
            </div>
          </div>

          <div class="mt-4">
            <NuxtLink
              to="/products"
              class="inline-block monolith-gradient px-12 py-5 rounded-md text-white font-label font-bold uppercase text-sm tracking-widest hover:opacity-90 transition-opacity"
            >
              Shop All Essentials
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
