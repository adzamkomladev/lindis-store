<script setup lang="ts">
// Newsletter CTA — Join the Monolith
const email = ref('')
</script>

<template>
  <section class="py-32 bg-[#f8f9fa]">
    <div class="max-w-screen-2xl mx-auto px-8">
      <div class="bg-[#e7e8e9] p-12 md:p-24 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12">
        <!-- Left: Copy -->
        <div class="max-w-xl relative z-10">
          <h2 class="font-headline font-extrabold tracking-tighter text-[#000622] mb-6 uppercase" style="font-size: clamp(2rem, 4vw, 3rem)">
            Join the Monolith.
          </h2>
          <p class="text-[#454650] text-lg font-body leading-relaxed">
            Receive exclusive access to seasonal drops and our editorial on sustainable living. No spam, only substance.
          </p>
        </div>

        <!-- Right: Form -->
        <div class="w-full md:w-auto min-w-[300px] relative z-10">
          <form class="flex flex-col gap-4" @submit.prevent>
            <div class="relative">
              <input
                v-model="email"
                type="email"
                placeholder="ENTER YOUR EMAIL"
                class="w-full bg-transparent border-0 border-b border-[#757681] py-4 px-0 focus:outline-none focus:border-[#000622] placeholder:text-[#757681] font-label font-bold text-sm tracking-widest transition-colors"
              />
            </div>
            <button
              type="submit"
              class="monolith-gradient py-4 px-8 text-white font-label font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
