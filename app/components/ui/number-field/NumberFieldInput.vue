<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { NumberFieldInput } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <NumberFieldInput
    data-slot="input"
    :class="cn('flex h-10 w-full rounded-sm border-0 bg-surface-container-low py-2 text-sm text-center shadow-xs transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:bg-surface-container-highest focus-visible:ring-primary/20 focus-visible:ring-[3px] outline-none', props.class)"
  />
</template>
