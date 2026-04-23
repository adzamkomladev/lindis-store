<script setup lang="ts">
import ProductGallery from '@/components/ProductGallery.vue'
import ProductInfo from '@/components/ProductInfo.vue'
import ProductTabs from '@/components/products/ProductTabs.vue'
import RelatedProducts from '@/components/products/RelatedProducts.vue'

const route = useRoute()
const { data: product, error } = await useFetch(`/api/products/${route.params.slug}`)

const { data: relatedProducts } = await useFetch('/api/products/featured', {
  query: { limit: 4 }
})

if (error.value || !product.value) {
  throw createError({ statusCode: 404, message: 'Product not found' })
}

useSeoMeta({
  title: `${product.value.name} | Lindi's Store`,
  description: product.value.description
})
</script>

<template>
  <div class="min-h-screen bg-background">

    <!-- Page Top: Breadcrumb -->
    <div class="pt-24 pb-8 px-8 max-w-screen-2xl mx-auto">
      <nav class="flex items-center gap-2 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
        <NuxtLink to="/" class="hover:text-primary transition-colors">Home</NuxtLink>
        <span class="material-symbols-outlined text-sm">navigate_next</span>
        <NuxtLink to="/products" class="hover:text-primary transition-colors">Products</NuxtLink>
        <span class="material-symbols-outlined text-sm">navigate_next</span>
        <span class="text-on-surface font-bold">{{ product.name }}</span>
      </nav>
    </div>

    <!-- Product Details: 7-col (gallery) / 5-col (info) split -->
    <section class="max-w-screen-2xl mx-auto px-8 pb-24">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-20 items-start">

        <!-- Left/Top: Image Gallery -->
        <div class="lg:col-span-7">
          <ProductGallery :images="product.images ?? []" />

          <!-- Product Tabs (visible below gallery on desktop) -->
          <div class="hidden lg:block mt-20 pt-12 border-t border-outline-variant/20">
            <p class="text-secondary font-label font-bold uppercase tracking-[0.2em] text-[10px] mb-6">Deeper Dive</p>
            <ProductTabs
              :product-id="product.id"
              :description="product.description"
              :spec-material="product.specMaterial"
              :spec-capacity="product.specCapacity"
              :spec-dimensions="product.specDimensions"
              :spec-weight="product.specWeight"
              :spec-insulation="product.specInsulation"
              :spec-temp-retention="product.specTempRetention"
            />
          </div>
        </div>

        <!-- Right/Bottom: Sticky Product Info -->
        <div class="lg:col-span-5 mt-12 lg:mt-0 lg:sticky lg:top-28">
          <ProductInfo :product="product" />

          <!-- Mobile: Product Tabs -->
          <div class="lg:hidden mt-16">
            <p class="text-secondary font-label font-bold uppercase tracking-[0.2em] text-[10px] mb-6">Deeper Dive</p>
            <ProductTabs
              :product-id="product.id"
              :description="product.description"
              :spec-material="product.specMaterial"
              :spec-capacity="product.specCapacity"
              :spec-dimensions="product.specDimensions"
              :spec-weight="product.specWeight"
              :spec-insulation="product.specInsulation"
              :spec-temp-retention="product.specTempRetention"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Sustainability Statement -->
    <section class="bg-primary py-24 text-center mt-12 rounded-t-3xl border-t border-primary-container shadow-xl">
      <div class="max-w-2xl mx-auto px-8">
        <p class="text-secondary font-label font-bold uppercase tracking-widest text-[10px] mb-4">Ethos & Care</p>
        <h3 class="font-headline font-medium italic text-4xl text-white mb-10">
          Crafted for Permanence
        </h3>
        <div class="grid grid-cols-3 gap-8">
          <div class="text-center">
            <span class="material-symbols-outlined text-secondary text-3xl mb-4 block">handshake</span>
            <p class="text-white font-bold text-[10px] uppercase tracking-wider font-label">Artisan Made</p>
          </div>
          <div class="text-center">
            <span class="material-symbols-outlined text-secondary text-3xl mb-4 block">recycling</span>
            <p class="text-white font-bold text-[10px] uppercase tracking-wider font-label">Sustainable</p>
          </div>
          <div class="text-center">
            <span class="material-symbols-outlined text-secondary text-3xl mb-4 block">verified</span>
            <p class="text-white font-bold text-[10px] uppercase tracking-wider font-label">Lifetime Guarantee</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Related Products -->
    <div class="max-w-screen-2xl mx-auto px-8 pb-24">
      <RelatedProducts
        v-if="relatedProducts?.length"
        :products="relatedProducts"
        title="Ecosystem Pairing"
      />
    </div>
  </div>
</template>
