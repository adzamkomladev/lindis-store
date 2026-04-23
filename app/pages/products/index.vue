<script setup lang="ts">
import { Package, X } from 'lucide-vue-next'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

const { data: products, pending } = await useFetch('/api/products')

const sortBy = ref('newest')
const activeCategory = ref('all')

const categories = [
  { value: 'all', label: 'All' },
  { value: 'bottles', label: 'Bottles' },
  { value: 'cups', label: 'Cups' },
  { value: 'accessories', label: 'Accessories' }
]

const activeFilters = computed(() => {
  const filters = []
  if (activeCategory.value !== 'all') {
    filters.push({ type: 'category', value: activeCategory.value, label: categories.find(c => c.value === activeCategory.value)?.label })
  }
  return filters
})

const clearFilter = (type: string) => {
  if (type === 'category') activeCategory.value = 'all'
  if (type === 'sort') sortBy.value = 'newest'
}

const clearAllFilters = () => {
  activeCategory.value = 'all'
  sortBy.value = 'newest'
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS'
  }).format(amount / 100)
}

useSeoMeta({
  title: "Engineered Containers | Lindi's Store",
  description: 'Browse our collection of premium water bottles and containers built with industrial precision.'
})
</script>

<template>
  <div class="min-h-screen bg-background">

    <!-- Editorial Page Header -->
    <section class="pt-32 pb-16 px-8 max-w-screen-2xl mx-auto border-b border-outline-variant/20 mb-12">
      <p class="text-secondary font-label font-bold uppercase tracking-widest text-[10px] mb-4">Permanent Collection</p>
      <h1 class="font-headline font-medium italic text-5xl tracking-tight text-on-surface mb-6">
        Curated Artifacts
      </h1>
      <div class="max-w-xl">
        <p class="text-on-surface-variant text-base leading-relaxed font-body">
          Timeless pieces crafted with artisanal care. Explore a collection designed to age beautifully in your kitchen.
        </p>
      </div>
    </section>

    <!-- Main Content: Sidebar + Grid -->
    <div class="px-8 max-w-screen-2xl mx-auto pb-20">
      <div class="flex flex-col md:flex-row gap-16">

        <!-- Sidebar Filters -->
        <aside class="w-full md:w-56 shrink-0">
          <!-- Mobile filter trigger -->
          <div class="flex md:hidden items-center gap-3 mb-8">
            <Sheet>
              <SheetTrigger as-child>
                <Button variant="outline" class="flex-1 h-12 rounded-md border-outline-variant/30 font-label font-bold uppercase text-[10px] tracking-widest text-on-surface hover:bg-surface-container-low transition-colors">
                  <span class="material-symbols-outlined text-sm mr-2">filter_list</span>
                  Filters
                  <span v-if="activeFilters.length > 0" class="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">
                    {{ activeFilters.length }}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent class="bg-surface-container-lowest border-outline-variant/20">
                <SheetHeader>
                  <SheetTitle class="font-headline font-medium text-2xl italic text-on-surface">Filters</SheetTitle>
                  <SheetDescription class="font-body text-sm text-on-surface-variant">Refine your selection.</SheetDescription>
                </SheetHeader>
                <div class="py-8 space-y-8">
                  <div>
                    <h3 class="font-label font-bold text-[10px] uppercase tracking-widest mb-4 border-b border-outline-variant/10 pb-2 text-on-surface">Category</h3>
                    <div class="space-y-4 pt-2">
                       <label v-for="cat in categories" :key="cat.value" class="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          :value="cat.value"
                          v-model="activeCategory"
                          class="w-4 h-4 border-outline-variant/30 text-primary focus:ring-primary/20 accent-primary"
                        />
                        <span class="text-sm font-body group-hover:text-primary transition-colors" :class="activeCategory === cat.value ? 'text-primary font-bold' : 'text-on-surface-variant'">
                          {{ cat.label }}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
                <SheetFooter class="absolute bottom-0 left-0 right-0 p-6 border-t border-outline-variant/20 bg-surface-container-lowest">
                  <div class="flex items-center gap-4 w-full">
                    <Button variant="ghost" class="w-full h-12 rounded-md font-label uppercase text-[10px] tracking-widest text-on-surface hover:bg-surface-container-low" @click="clearAllFilters">Clear All</Button>
                    <SheetClose as-child>
                      <Button class="w-full h-12 rounded-md btn-primary text-white font-label uppercase text-[10px] tracking-widest shadow-sm">View Results</Button>
                    </SheetClose>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Select v-model="sortBy">
              <SelectTrigger class="flex-1 h-12 rounded-md border-outline-variant/30 font-label font-bold uppercase text-[10px] tracking-widest text-on-surface hover:bg-surface-container-low transition-colors">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent class="bg-surface-container-lowest border-outline-variant/20 rounded-md">
                <SelectItem value="newest" class="text-xs font-body cursor-pointer">Featured</SelectItem>
                <SelectItem value="price-low" class="text-xs font-body cursor-pointer">Price ↑</SelectItem>
                <SelectItem value="price-high" class="text-xs font-body cursor-pointer">Price ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Desktop sidebar -->
          <div class="hidden md:block space-y-12">
            <!-- Category Filter -->
            <section>
              <h3 class="font-label font-bold text-[10px] uppercase tracking-widest mb-6 border-b border-outline-variant/10 pb-2 text-on-surface">Category</h3>
              <div class="space-y-4">
                <label v-for="cat in categories" :key="cat.value" class="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    :value="cat.value"
                    v-model="activeCategory"
                    class="w-4 h-4 border-outline-variant/30 text-primary focus:ring-primary/20 accent-primary rounded-sm"
                  />
                  <span class="text-sm font-body group-hover:text-primary transition-colors" :class="activeCategory === cat.value ? 'text-primary font-bold' : 'text-on-surface-variant'">
                    {{ cat.label }}
                  </span>
                </label>
              </div>
            </section>

            <!-- Sort -->
            <section>
              <h3 class="font-label font-bold text-[10px] uppercase tracking-widest mb-6 border-b border-outline-variant/10 pb-2 text-on-surface">Sort</h3>
              <div class="space-y-4">
                <label v-for="opt in [{ value: 'newest', label: 'Featured' }, { value: 'price-low', label: 'Price: Low to High' }, { value: 'price-high', label: 'Price: High to Low' }]" :key="opt.value" class="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    :value="opt.value"
                    v-model="sortBy"
                    class="w-4 h-4 border-outline-variant/30 text-primary focus:ring-primary/20 accent-primary rounded-sm"
                  />
                  <span class="text-sm font-body group-hover:text-primary transition-colors" :class="sortBy === opt.value ? 'text-primary font-bold' : 'text-on-surface-variant'">
                    {{ opt.label }}
                  </span>
                </label>
              </div>
            </section>
          </div>
        </aside>

        <!-- Product Grid -->
        <div class="flex-1">
          <!-- Toolbar -->
          <div class="flex justify-between items-end mb-10 border-b border-outline-variant/10 pb-6">
            <p class="text-sm text-on-surface-variant font-body">
              Showing {{ products?.length ?? 0 }} Artifacts
            </p>
            <div class="hidden md:flex items-center gap-2 cursor-pointer group">
              <span class="text-[10px] font-bold uppercase tracking-widest font-label text-on-surface group-hover:text-primary transition-colors">
                Sort: {{ sortBy === 'newest' ? 'Featured' : sortBy === 'price-low' ? 'Price ↑' : 'Price ↓' }}
              </span>
              <span class="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary">expand_more</span>
            </div>
          </div>

          <!-- Active Filters -->
          <div v-if="activeFilters.length > 0" class="flex items-center gap-2 mb-8 flex-wrap">
            <span
              v-for="filter in activeFilters"
              :key="filter.type"
              class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-label font-bold uppercase tracking-widest bg-surface-container-low text-on-surface cursor-pointer ring-1 ring-outline-variant/20 hover:bg-surface-container transition-colors shadow-sm"
            >
              {{ filter.label }}
              <button @click="clearFilter(filter.type)" class="hover:text-primary transition-colors">
                <X class="w-3 h-3" />
              </button>
            </span>
          </div>

          <!-- Loading State -->
          <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div v-for="i in 6" :key="i" class="animate-pulse bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-4">
              <div class="aspect-square bg-surface-container-low rounded-lg"></div>
              <div class="mt-4 space-y-2">
                <div class="h-4 bg-surface-container-low w-3/4 rounded-sm"></div>
                <div class="h-3 bg-surface-container-low w-1/2 rounded-sm"></div>
              </div>
            </div>
          </div>

          <!-- Products Grid -->
          <div v-else-if="products?.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <article
              v-for="product in products"
              :key="product.id"
            >
              <NuxtLink :to="`/products/${product.slug}`" class="block group bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-4 shadow-sm hover:-translate-y-1 transition-all">
                <!-- Product Image -->
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
                  <!-- Tag chip -->
                  <div v-if="product.category" class="absolute top-3 left-3">
                    <span class="bg-white/90 backdrop-blur-sm text-on-surface text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded shadow-sm border border-black/5">
                      {{ product.category }}
                    </span>
                  </div>
                </div>

                <!-- Product Info -->
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
                  <!-- Reviews mock -->
                  <div class="flex items-center gap-1.5 mt-4 pt-3 border-t border-outline-variant/10">
                    <div class="flex text-secondary gap-0.5 text-[10px]">
                      ★ ★ ★ ★ ★
                    </div>
                  </div>
                </div>
              </NuxtLink>
            </article>
          </div>

          <!-- Empty State -->
          <div v-else class="py-24 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/10">
            <Package class="w-12 h-12 mx-auto text-outline-variant mb-4" />
            <h2 class="font-headline font-medium italic text-2xl text-on-surface mb-2">No Artifacts Found</h2>
            <p class="text-sm text-on-surface-variant font-body mb-8">Adjust your filters or check back soon for new arrivals.</p>
            <button
              @click="clearAllFilters"
              class="btn-primary px-8 py-3 rounded-md text-white font-label font-bold uppercase text-[10px] tracking-widest shadow-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
