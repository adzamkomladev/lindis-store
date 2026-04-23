<script setup lang="ts">
import { Package } from 'lucide-vue-next'
</script>

<template>
  <div class="flex flex-col items-center justify-center py-24 px-4">
    <div class="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6">
      <Package class="w-10 h-10 text-stone-400" />
    </div>
    <h2 class="text-xl font-semibold text-stone-900 mb-2">No products yet</h2>
    <p class="text-stone-500 text-center max-w-sm">
      We're working on something amazing. Check back soon for our collection.
    </p>
  </div>
</template>
