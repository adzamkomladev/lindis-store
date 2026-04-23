<script setup lang="ts">
const props = defineProps<{
  images: string[]
}>()

const selectedIndex = ref(0)
const selectedImage = computed(() => props.images?.[selectedIndex.value])

const next = () => {
  if (props.images?.length) {
    selectedIndex.value = (selectedIndex.value + 1) % props.images.length
  }
}

const prev = () => {
  if (props.images?.length) {
    selectedIndex.value = selectedIndex.value === 0 ? props.images.length - 1 : selectedIndex.value - 1
  }
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- Large hero image (spans both columns on mobile, 2 cols on md) -->
    <div class="md:col-span-2 overflow-hidden aspect-[4/5] bg-[#f3f4f5] group relative">
      <img
        v-if="selectedImage"
        :src="`/images/${selectedImage}`"
        :alt="`Product image`"
        class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-[#c5c6d1]">
        <span class="material-symbols-outlined text-6xl">inventory_2</span>
      </div>

      <!-- Navigation arrows on mobile -->
      <template v-if="images?.length > 1">
        <button
          @click="prev"
          class="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/90 text-[#000622] hover:bg-white transition-colors md:hidden"
          aria-label="Previous image"
        >
          <span class="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        <button
          @click="next"
          class="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/90 text-[#000622] hover:bg-white transition-colors md:hidden"
          aria-label="Next image"
        >
          <span class="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </template>

      <!-- Mobile dots -->
      <div v-if="images?.length > 1" class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
        <button
          v-for="(_, idx) in images"
          :key="idx"
          @click="selectedIndex = idx"
          class="w-2 h-2 rounded-full transition-all duration-200"
          :class="idx === selectedIndex ? 'bg-[#000622] w-4' : 'bg-[#000622]/30'"
        />
      </div>
    </div>

    <!-- Thumbnail grid (smaller images) -->
    <template v-if="images?.length > 1">
      <div
        v-for="(img, idx) in images.slice(0, 2)"
        :key="idx"
        class="hidden md:block aspect-square overflow-hidden bg-[#f3f4f5] cursor-pointer relative"
        :class="idx === selectedIndex ? 'ring-2 ring-[#000622]' : 'hover:opacity-80 transition-opacity'"
        @click="selectedIndex = idx"
      >
        <img
          :src="`/images/${img}`"
          :alt="`Product view ${idx + 1}`"
          class="w-full h-full object-cover"
        />
      </div>
    </template>
  </div>
</template>
