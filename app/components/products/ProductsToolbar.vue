<script setup lang="ts">
import { Grid3x3, List, SlidersHorizontal } from 'lucide-vue-next'

const view = defineModel<'grid' | 'list'>('view', { default: 'grid' })
const sortBy = defineModel<string>('sortBy', { default: 'newest' })
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-stone-100">
    <p class="text-sm text-stone-500">
      <slot name="count" />
    </p>
    
    <div class="flex items-center gap-4">
      <!-- Sort -->
      <div class="flex items-center gap-2">
        <SlidersHorizontal class="w-4 h-4 text-stone-400" />
        <NativeSelect v-model="sortBy" class="h-9 text-sm">
          <NativeSelectOption value="newest">Newest</NativeSelectOption>
          <NativeSelectOption value="price-low">Price: Low to High</NativeSelectOption>
          <NativeSelectOption value="price-high">Price: High to Low</NativeSelectOption>
          <NativeSelectOption value="name">Name</NativeSelectOption>
        </NativeSelect>
      </div>
      
      <!-- View Toggle -->
      <div class="hidden sm:flex items-center border border-stone-200 rounded-lg overflow-hidden">
        <button 
          @click="view = 'grid'"
          class="p-2 transition-colors"
          :class="view === 'grid' ? 'bg-stone-900 text-white' : 'bg-white text-stone-400 hover:text-stone-600'"
        >
          <Grid3x3 class="w-4 h-4" />
        </button>
        <button 
          @click="view = 'list'"
          class="p-2 transition-colors"
          :class="view === 'list' ? 'bg-stone-900 text-white' : 'bg-white text-stone-400 hover:text-stone-600'"
        >
          <List class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
