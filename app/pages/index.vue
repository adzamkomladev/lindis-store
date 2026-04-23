<script setup lang="ts">
import HeroSection from '@/components/home/HeroSection.vue'
import FeaturedProducts from '@/components/home/FeaturedProducts.vue'
import FeaturesSection from '@/components/home/FeaturesSection.vue'
import TestimonialsSection from '@/components/home/TestimonialsSection.vue'
import BrandStorySection from '@/components/home/BrandStorySection.vue'
import CtaSection from '@/components/home/CtaSection.vue'

const { data: featuredProducts } = await useFetch('/api/products/featured')
const { data: stats } = await useFetch('/api/stats')

useSeoMeta({
  title: "Engineered for Life | Lindi's Store",
  description: 'Premium hydration essentials crafted in Ghana. Sustainable, durable, and built to last a lifetime.'
})
</script>

<template>
  <div class="px-4 sm:px-8">
    <HeroSection
      title="Where Heritage Meets the Modern Kitchen"
      subtitle="Curating timeless pieces that transform everyday cooking into an interactive, elevated experience."
    />

    <!-- Shop by Category -->
    <section class="max-w-screen-2xl mx-auto py-20 border-b border-outline-variant/20">
      <div class="flex justify-between items-end mb-12">
        <h2 class="font-headline font-bold text-3xl italic text-on-surface">Shop by Category</h2>
        <NuxtLink to="/products" class="font-label text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">View All Collections</NuxtLink>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Appliances -->
        <NuxtLink to="/products?category=appliances" class="group block">
          <div class="aspect-[4/5] rounded-xl overflow-hidden mb-4 transition-transform group-hover:-translate-y-1 relative">
            <img src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&h=750&fit=crop" alt="Appliances" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
          </div>
          <h3 class="font-headline font-bold text-lg mb-1">Appliances</h3>
          <p class="font-body text-sm text-on-surface-variant">Modern kitchen power.</p>
        </NuxtLink>

        <!-- Blenders -->
        <NuxtLink to="/products?category=blenders" class="group block">
          <div class="aspect-[4/5] rounded-xl overflow-hidden mb-4 transition-transform group-hover:-translate-y-1 relative">
            <img src="https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&h=750&fit=crop" alt="Blenders" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
          </div>
          <h3 class="font-headline font-bold text-lg mb-1">Blenders</h3>
          <p class="font-body text-sm text-on-surface-variant">Powerful precision.</p>
        </NuxtLink>

        <!-- Baking -->
        <NuxtLink to="/products?category=baking" class="group block">
          <div class="aspect-[4/5] rounded-xl overflow-hidden mb-4 transition-transform group-hover:-translate-y-1 relative">
            <img src="https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=600&h=750&fit=crop" alt="Baking" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
          </div>
          <h3 class="font-headline font-bold text-lg mb-1">Baking</h3>
          <p class="font-body text-sm text-on-surface-variant">Perfected textures.</p>
        </NuxtLink>

        <!-- Utensils -->
        <NuxtLink to="/products?category=utensils" class="group block">
          <div class="aspect-[4/5] rounded-xl overflow-hidden mb-4 transition-transform group-hover:-translate-y-1 relative">
            <img src="https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600&h=750&fit=crop" alt="Utensils" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
          </div>
          <h3 class="font-headline font-bold text-lg mb-1">Utensils</h3>
          <p class="font-body text-sm text-on-surface-variant">Tactile control.</p>
        </NuxtLink>
      </div>
    </section>

    <!-- Featured Products -->
    <FeaturedProducts
      title="Featured Products"
      subtitle=""
      :products="featuredProducts ?? []"
    />

    <!-- The Autumnal Curated Set -->
    <section class="max-w-screen-2xl mx-auto py-24 border-t border-outline-variant/20">
      <div class="flex flex-col lg:flex-row gap-16 items-center">
        <!-- Asymmetric Graphics -->
        <div class="w-full lg:w-1/2 flex items-end gap-6 relative">
             <div class="w-1/2 aspect-square bg-[#111] rounded-xl shadow-lg border border-white/10 flex items-center justify-center relative translate-y-8">
                <span class="font-headline text-secondary text-9xl font-black absolute z-10 bottom-4">1</span>
             </div>
             <div class="w-[55%] aspect-square bg-[#1f404d] rounded-xl shadow-lg border border-white/10 flex items-center justify-center relative">
                <span class="font-headline text-[#c56d47] text-[12rem] font-black absolute z-10 -bottom-8">2</span>
             </div>
        </div>

        <!-- Text Content -->
        <div class="w-full lg:w-1/2 max-w-lg">
           <span class="font-label text-[10px] uppercase font-bold text-secondary tracking-widest block mb-4">New Arrivals</span>
           <h2 class="font-headline font-medium italic text-5xl mb-6 text-on-surface tracking-tight">The Autumnal Curated Set</h2>
           <p class="font-body text-on-surface-variant leading-relaxed mb-8">
             Introducing our latest collaboration with master potters from the Tuscan coast. 
             A collection designed for slow mornings and gathering around the table.
           </p>
           
           <ul class="space-y-4 mb-10">
             <li class="flex items-center gap-3 font-body text-sm text-on-surface">
               <div class="w-1.5 h-1.5 rounded-full bg-secondary"></div>
               Hand-thrown stoneware from clay
             </li>
             <li class="flex items-center gap-3 font-body text-sm text-on-surface">
               <div class="w-1.5 h-1.5 rounded-full bg-secondary"></div>
               Lead-free, organic matte glazes
             </li>
             <li class="flex items-center gap-3 font-body text-sm text-on-surface">
               <div class="w-1.5 h-1.5 rounded-full bg-secondary"></div>
               Limited run of 500 signed pieces
             </li>
           </ul>

           <NuxtLink to="/products" class="btn-primary inline-flex items-center px-8 py-4 rounded-md font-label uppercase text-xs font-bold tracking-widest text-white">
             Discover the Set
           </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Join the Editorial -->
    <section class="max-w-screen-2xl mx-auto rounded-xl bg-primary text-white py-24 px-8 text-center shadow-xl mb-12">
      <div class="max-w-xl mx-auto">
        <h2 class="font-headline font-medium italic text-4xl mb-4">Join the Editorial</h2>
        <p class="font-body text-white/70 mb-10 text-sm">
          Receive quarterly updates on heritage craftsmanship, exclusive product launches, and seasonal recipes.
        </p>

        <form class="flex flex-col sm:flex-row gap-4" @submit.prevent>
           <input type="email" placeholder="Your email address" class="flex-1 bg-white/10 border-0 rounded-md py-4 px-6 text-white placeholder:text-white/40 focus:ring-2 focus:ring-secondary/50 font-body text-sm" />
           <button class="bg-secondary hover:bg-secondary-container transition-colors text-white font-label uppercase text-xs tracking-widest font-bold py-4 px-8 rounded-md whitespace-nowrap">
             Subscribe
           </button>
        </form>
      </div>
    </section>

  </div>
</template>
