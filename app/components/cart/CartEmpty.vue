<script setup lang="ts">
// Editorial empty cart state
</script>

<template>
  <div class="py-32 text-center max-w-lg mx-auto">
    <span class="material-symbols-outlined text-[#c5c6d1] block mb-8" style="font-size: 4rem">shopping_bag</span>
    <h2 class="font-headline font-black text-[#000622] mb-4 tracking-tighter uppercase" style="font-size: 1.75rem">
      Your Cart Is Empty
    </h2>
    <p class="text-[#454650] font-body text-lg leading-relaxed mb-10">
      Explore our permanent collection and discover pieces engineered to endure.
    </p>
    <NuxtLink
      to="/products"
      class="inline-block monolith-gradient px-12 py-5 text-white font-label font-bold uppercase text-sm tracking-widest hover:opacity-90 transition-opacity"
    >
      Shop the Collection
    </NuxtLink>
  </div>
</template>
