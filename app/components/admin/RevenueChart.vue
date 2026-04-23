<script setup lang="ts">
import { AreaChart } from '@/components/ui/chart'

const props = defineProps<{
  data?: Array<{ month: string; revenue: number; orders: number }>
}>()

// Sample data for demo
const chartData = computed(() => props.data || [
  { month: 'Jan', revenue: 125000, orders: 45 },
  { month: 'Feb', revenue: 148000, orders: 52 },
  { month: 'Mar', revenue: 172000, orders: 58 },
  { month: 'Apr', revenue: 165000, orders: 55 },
  { month: 'May', revenue: 189000, orders: 63 },
  { month: 'Jun', revenue: 215000, orders: 72 },
  { month: 'Jul', revenue: 198000, orders: 68 }
])

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))'
  },
  orders: {
    label: 'Orders',
    color: 'hsl(var(--chart-2))'
  }
}
</script>

<template>
  <div class="w-full h-[300px] md:h-[350px]">
    <AreaChart
      :data="chartData"
      :config="chartConfig"
      index="month"
      :categories="['revenue']"
      :colors="['#10b981']"
      :y-formatter="(value: number) => `GHS ${(value / 100).toLocaleString()}`"
    />
  </div>
</template>
