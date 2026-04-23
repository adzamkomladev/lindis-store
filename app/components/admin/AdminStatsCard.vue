<script setup lang="ts">
import type { Component } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

defineProps<{
  title: string
  value: string | number
  icon: Component
  iconBgClass?: string
  iconColorClass?: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  loading?: boolean
}>()
</script>

<template>
  <Card class="border-0 shadow-md">
    <CardContent class="p-3 md:p-4">
      <div class="flex items-center gap-2 md:gap-3">
        <div 
          :class="[
            iconBgClass || 'bg-primary/10',
            'p-2 md:p-2.5 rounded-lg md:rounded-xl shrink-0 animate-icon-pulse'
          ]"
        >
          <component 
            :is="icon" 
            :class="[iconColorClass || 'text-primary', 'w-4 h-4 md:w-5 md:h-5']" 
          />
        </div>
        <div class="min-w-0 flex-1">
          <div v-if="loading" class="h-6 md:h-8 w-16 md:w-24">
            <Skeleton class="h-6 md:h-8 w-full" />
          </div>
          <p v-else class="text-lg md:text-2xl font-bold text-foreground">{{ value }}</p>
          <p class="text-[10px] md:text-xs text-muted-foreground truncate">{{ title }}</p>
        </div>
      </div>
      
      <!-- Change indicator -->
      <div v-if="change && !loading" class="mt-2 md:mt-3">
        <span 
          :class="[
            'inline-flex items-center text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full',
            changeType === 'positive' ? 'bg-emerald-50 text-emerald-600' :
            changeType === 'negative' ? 'bg-destructive/10 text-destructive' :
            'bg-muted text-muted-foreground'
          ]"
        >
          {{ change }}
        </span>
      </div>
    </CardContent>
  </Card>
</template>
