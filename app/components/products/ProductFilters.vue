<script setup lang="ts">
import { X, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

const props = defineProps<{
  minPrice?: number
  maxPrice?: number
  categories?: string[]
}>()

const emit = defineEmits<{
  (e: 'update:priceRange', value: [number, number]): void
  (e: 'update:category', value: string | null): void
  (e: 'clear'): void
}>()

const priceRange = ref<[number, number]>([props.minPrice || 0, props.maxPrice || 50000])
const selectedCategory = ref<string | null>(null)
const isPriceOpen = ref(true)
const isCategoryOpen = ref(true)

const categories = computed(() => props.categories || ['Bottles', 'Cups', 'Accessories'])

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0
  }).format(amount / 100)
}

const handlePriceChange = (value: number[]) => {
  priceRange.value = [value[0], value[1]]
  emit('update:priceRange', [value[0], value[1]])
}

const handleCategorySelect = (category: string) => {
  if (selectedCategory.value === category) {
    selectedCategory.value = null
  } else {
    selectedCategory.value = category
  }
  emit('update:category', selectedCategory.value)
}

const clearFilters = () => {
  priceRange.value = [props.minPrice || 0, props.maxPrice || 50000]
  selectedCategory.value = null
  emit('clear')
}

const hasActiveFilters = computed(() => {
  return selectedCategory.value !== null || 
    priceRange.value[0] !== (props.minPrice || 0) || 
    priceRange.value[1] !== (props.maxPrice || 50000)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="font-semibold text-stone-900">Filters</h3>
      <Button 
        v-if="hasActiveFilters"
        variant="ghost" 
        size="sm" 
        class="text-stone-500 hover:text-stone-900 h-8 px-2"
        @click="clearFilters"
      >
        <X class="w-4 h-4 mr-1" />
        Clear
      </Button>
    </div>

    <!-- Category Filter -->
    <div class="border-t border-stone-100 pt-4">
      <button 
        class="flex items-center justify-between w-full text-left"
        @click="isCategoryOpen = !isCategoryOpen"
      >
        <span class="font-medium text-sm text-stone-900">Category</span>
        <ChevronUp v-if="isCategoryOpen" class="w-4 h-4 text-stone-400" />
        <ChevronDown v-else class="w-4 h-4 text-stone-400" />
      </button>
      
      <div v-if="isCategoryOpen" class="mt-3 space-y-2">
        <button
          v-for="category in categories"
          :key="category"
          @click="handleCategorySelect(category)"
          :class="[
            'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
            selectedCategory === category 
              ? 'bg-stone-900 text-white' 
              : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
          ]"
        >
          {{ category }}
        </button>
      </div>
    </div>

    <!-- Price Filter -->
    <div class="border-t border-stone-100 pt-4">
      <button 
        class="flex items-center justify-between w-full text-left"
        @click="isPriceOpen = !isPriceOpen"
      >
        <span class="font-medium text-sm text-stone-900">Price Range</span>
        <ChevronUp v-if="isPriceOpen" class="w-4 h-4 text-stone-400" />
        <ChevronDown v-else class="w-4 h-4 text-stone-400" />
      </button>
      
      <div v-if="isPriceOpen" class="mt-4">
        <Slider
          :default-value="[priceRange[0], priceRange[1]]"
          :min="minPrice || 0"
          :max="maxPrice || 50000"
          :step="1000"
          @update:model-value="handlePriceChange"
          class="mb-4"
        />
        <div class="flex items-center justify-between text-sm text-stone-600">
          <span>{{ formatPrice(priceRange[0]) }}</span>
          <span>{{ formatPrice(priceRange[1]) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
