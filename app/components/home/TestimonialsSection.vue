<script setup lang="ts">
// Editorial blockquote testimonial section
</script>

<template>
  <section class="bg-[#f3f4f5] py-24">
    <div class="max-w-3xl mx-auto px-8 text-center">
      <!-- Stars -->
      <div class="flex justify-center gap-1 mb-8">
        <span
          v-for="i in 5"
          :key="i"
          class="material-symbols-outlined text-[#000622] text-xl"
          style="font-variation-settings: 'FILL' 1"
        >star</span>
      </div>

      <!-- Editorial blockquote -->
      <blockquote class="font-headline font-black italic text-[#000622] leading-tight mb-10" style="font-size: clamp(1.5rem, 3vw, 2.25rem)">
        "Every Effero bottle is engineered for a lifetime of use. The quality, the texture, and the craftsmanship is truly unmatched."
      </blockquote>

      <cite class="font-label text-sm uppercase tracking-widest text-[#757681] not-italic">
        — Satisfied Customer, Accra, Ghana
      </cite>
    </div>
  </section>
</template>
