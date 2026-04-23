<script setup lang="ts">
// Sustainability stats — dark navy impact section
defineProps<{
  stats?: {
    totalOrders: number
    totalProducts: number
  }
}>()
</script>

<template>
  <section class="bg-[#000622] py-24 text-center">
    <div class="max-w-4xl mx-auto px-8">
      <h3 class="font-headline text-3xl md:text-4xl font-bold text-white mb-16 tracking-tighter uppercase">
        Our Impact Since 2021
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div class="flex flex-col items-center">
          <span class="text-[#b1c6ff] font-headline font-black mb-2 tracking-tighter" style="font-size: 3rem">
            {{ stats?.totalOrders ? `${stats.totalOrders}+` : '1.2K+' }}
          </span>
          <p class="text-white/60 font-label font-bold uppercase text-xs tracking-widest">Single-use plastics diverted</p>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-[#b1c6ff] font-headline font-black mb-2 tracking-tighter" style="font-size: 3rem">100%</span>
          <p class="text-white/60 font-label font-bold uppercase text-xs tracking-widest">Carbon Neutral Shipping</p>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-[#b1c6ff] font-headline font-black mb-2 tracking-tighter" style="font-size: 3rem">BPA</span>
          <p class="text-white/60 font-label font-bold uppercase text-xs tracking-widest">Completely Toxic-Free Build</p>
        </div>
      </div>
    </div>
  </section>
</template>
