<script setup lang="ts">
import { Search, Package, X } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const query = ref((route.query.q as string) || '')

const { data: results, pending } = await useFetch('/api/products/search', {
  query: computed(() => ({ q: query.value })),
  immediate: !!query.value,
})

const performSearch = () => {
  if (!query.value.trim()) return
  router.push({ path: '/search', query: { q: query.value } })
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount / 100)
}

useSeoMeta({
  title: query.value ? `Search: ${query.value} | Lindi's Store` : "Search | Lindi's Store",
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <section class="pt-32 pb-12 px-8 max-w-screen-2xl mx-auto border-b border-outline-variant/20">
      <p class="text-secondary font-label font-bold uppercase tracking-widest text-[10px] mb-4">Search</p>
      <h1 class="font-headline font-medium italic text-5xl tracking-tight text-on-surface mb-8">
        Find Your Perfect Piece
      </h1>
      <div class="max-w-xl">
        <div class="relative">
          <input
            v-model="query"
            type="text"
            placeholder="Search products, categories..."
            class="w-full bg-surface-container-low rounded-sm border-0 py-4 pl-12 pr-12 text-lg font-body focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant text-on-surface"
            @keyup.enter="performSearch"
          />
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <button v-if="query" @click="query = ''" class="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
            <X class="w-5 h-5" />
          </button>
        </div>
        <button
          @click="performSearch"
          class="mt-4 px-8 py-3 bg-[#000622] text-white font-label font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </div>
    </section>

    <div class="px-8 max-w-screen-2xl mx-auto py-12 pb-24">
      <!-- Loading -->
      <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div v-for="i in 6" :key="i" class="animate-pulse bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-4">
          <div class="aspect-square bg-surface-container-low rounded-lg"></div>
          <div class="mt-4 space-y-2">
            <div class="h-4 bg-surface-container-low w-3/4 rounded-sm"></div>
            <div class="h-3 bg-surface-container-low w-1/2 rounded-sm"></div>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div v-else-if="results?.products?.length">
        <p class="text-sm text-on-surface-variant font-body mb-8">
          Found {{ results.total }} result{{ results.total !== 1 ? 's' : '' }} for "<span class="text-on-surface font-bold">{{ query }}</span>"
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <NuxtLink
            v-for="product in results.products"
            :key="product._id"
            :to="`/products/${product.slug}`"
            class="block group bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-4 shadow-sm hover:-translate-y-1 transition-all"
          >
            <div class="aspect-square bg-surface-container-low rounded-lg overflow-hidden mb-6 relative border border-outline-variant/5">
              <NuxtImg
                v-if="product.images?.length"
                :src="`/images/${product.images[0]}`"
                :alt="product.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-outline-variant">
                <Package class="w-12 h-12" />
              </div>
              <div v-if="product.category" class="absolute top-3 left-3">
                <span class="bg-white/90 backdrop-blur-sm text-on-surface text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded shadow-sm border border-black/5">
                  {{ product.category }}
                </span>
              </div>
            </div>
            <div class="space-y-1 px-1">
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-headline font-semibold text-lg leading-tight text-on-surface group-hover:text-primary transition-colors pr-2">
                  {{ product.name }}
                </h4>
                <p class="font-body font-semibold text-sm text-on-surface whitespace-nowrap">
                  {{ formatPrice(product.price) }}
                </p>
              </div>
              <p v-if="product.description" class="text-sm text-on-surface-variant font-body line-clamp-2 leading-relaxed">
                {{ product.description }}
              </p>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- No Results -->
      <div v-else-if="query && !pending" class="text-center py-24">
        <Package class="w-12 h-12 mx-auto text-outline-variant mb-4" />
        <h2 class="font-headline font-medium italic text-2xl text-on-surface mb-2">No results found</h2>
        <p class="text-sm text-on-surface-variant font-body">Try searching with different keywords.</p>
      </div>
    </div>
  </div>
</template>
