<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    data-slot="card"
    :class="
      cn(
        'bg-surface-container-lowest text-on-surface flex flex-col gap-6 rounded-lg border-0 py-6 shadow-xs',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
