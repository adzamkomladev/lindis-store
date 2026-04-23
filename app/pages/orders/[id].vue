<script setup lang="ts">
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  ShoppingBag,
  Home,
  Repeat
} from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

const route = useRoute()
const orderId = route.params.id as string

const { data: order, pending, error } = await useFetch(`/api/orders/${orderId}`)

if (error.value) {
  throw createError({ statusCode: 404, message: 'Order not found' })
}

useSeoMeta({
  title: order.value ? `Order ${order.value.orderNumber}` : 'Order Details'
})

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS'
  }).format(amount / 100)
}

const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

const statusConfig: Record<string, { icon: any, class: string, bgClass: string, label: string, description: string }> = {
  pending: { 
    icon: Clock, 
    class: 'text-amber-700', 
    bgClass: 'bg-amber-50 border-amber-200', 
    label: 'Pending',
    description: 'Your order is awaiting confirmation'
  },
  processing: { 
    icon: Package, 
    class: 'text-blue-700', 
    bgClass: 'bg-blue-50 border-blue-200', 
    label: 'Processing',
    description: 'We are preparing your order'
  },
  shipped: { 
    icon: Truck, 
    class: 'text-violet-700', 
    bgClass: 'bg-violet-50 border-violet-200', 
    label: 'Shipped',
    description: 'Your order is on its way'
  },
  delivered: { 
    icon: CheckCircle2, 
    class: 'text-emerald-700', 
    bgClass: 'bg-emerald-50 border-emerald-200', 
    label: 'Delivered',
    description: 'Your order has been delivered'
  },
  cancelled: { 
    icon: XCircle, 
    class: 'text-red-700', 
    bgClass: 'bg-red-50 border-red-200', 
    label: 'Cancelled',
    description: 'This order has been cancelled'
  }
}

const paymentStatusConfig: Record<string, { class: string, label: string }> = {
  unpaid: { class: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Unpaid' },
  paid: { class: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Paid' },
  refunded: { class: 'bg-stone-100 text-stone-700 border-stone-200', label: 'Refunded' }
}

const getStatusConfig = (status: string) => statusConfig[status] || statusConfig.pending
const getPaymentConfig = (status: string) => paymentStatusConfig[status] || paymentStatusConfig.unpaid

const shippingDetails = computed(() => {
  if (!order.value?.shippingDetails) return null
  return order.value.shippingDetails as {
    name?: string
    phone?: string
    address?: string
    city?: string
  }
})

const { addToCart } = useCart()
const reorder = async () => {
  if (!order.value) return
  try {
    const { items } = await $fetch('/api/orders/reorder', {
      method: 'POST',
      body: { orderId: orderId },
    })
    for (const item of items) {
      addToCart({
        _id: item.id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        images: item.image ? [item.image] : [],
      }, item.quantity)
    }
    navigateTo('/cart')
  } catch (err: any) {
    console.error('Reorder failed:', err)
  }
}

// Order timeline steps
const timelineSteps = computed(() => {
  if (!order.value) return []
  
  const steps = [
    { key: 'pending', label: 'Order Placed', icon: ShoppingBag },
    { key: 'processing', label: 'Processing', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 }
  ]
  
  const currentIndex = steps.findIndex(s => s.key === order.value?.status)
  
  return steps.map((step, index) => ({
    ...step,
    completed: index <= currentIndex && order.value?.status !== 'cancelled',
    current: index === currentIndex
  }))
})
</script>

<template>
  <div class="min-h-screen bg-muted/50">
    <div class="container py-6 md:py-8 max-w-4xl">
      <!-- Back Button -->
      <NuxtLink 
        to="/products"
        class="inline-flex items-center gap-2 text-xs md:text-sm text-muted-foreground hover:text-foreground mb-4 md:mb-6 transition-colors"
      >
        <ArrowLeft class="w-3.5 h-3.5 md:w-4 md:h-4" />
        Continue Shopping
      </NuxtLink>

      <!-- Loading State -->
      <div v-if="pending" class="space-y-4 md:space-y-6">
        <Skeleton class="h-8 md:h-10 w-48 md:w-64" />
        <Card class="border-0 shadow-sm">
          <CardContent class="p-4 md:p-6 space-y-4">
            <Skeleton class="h-16 md:h-20 w-full" />
            <Skeleton class="h-16 md:h-20 w-full" />
          </CardContent>
        </Card>
      </div>

      <div v-else-if="order" class="space-y-4 md:space-y-6">
        <!-- Header -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h1 class="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
              Order {{ order.orderNumber }}
            </h1>
            <p class="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
              Placed on {{ formatDate(order.createdAt) }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <Badge 
              :class="[getStatusConfig(order.status).bgClass, getStatusConfig(order.status).class, 'border text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 self-start sm:self-auto']"
            >
              <component :is="getStatusConfig(order.status).icon" class="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
              {{ getStatusConfig(order.status).label }}
            </Badge>
            <Button 
              v-if="order.status === 'delivered'"
              size="sm"
              variant="outline"
              class="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
              @click="reorder"
            >
              <Repeat class="w-4 h-4" />
              <span class="hidden sm:inline">Reorder</span>
            </Button>
          </div>
        </div>

        <!-- Order Timeline (Desktop) -->
        <Card v-if="order.status !== 'cancelled'" class="border-0 shadow-sm hidden md:block">
          <CardContent class="p-4 md:p-6">
            <div class="flex items-center justify-between">
              <template v-for="(step, index) in timelineSteps" :key="step.key">
                <div class="flex flex-col items-center">
                  <div 
                    class="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors"
                    :class="step.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-400'"
                  >
                    <component :is="step.icon" class="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span 
                    class="text-xs md:text-sm mt-1.5 md:mt-2 font-medium"
                    :class="step.completed ? 'text-stone-900' : 'text-stone-400'"
                  >
                    {{ step.label }}
                  </span>
                </div>
                <div 
                  v-if="index < timelineSteps.length - 1"
                  class="flex-1 h-0.5 md:h-1 mx-2 md:mx-4 rounded-full"
                  :class="timelineSteps[index + 1]?.completed ? 'bg-emerald-200' : 'bg-stone-200'"
                />
              </template>
            </div>
          </CardContent>
        </Card>

        <!-- Mobile Timeline -->
        <Card v-if="order.status !== 'cancelled'" class="border-0 shadow-sm md:hidden">
          <CardContent class="p-4">
            <div class="flex items-center gap-2 overflow-x-auto pb-2">
              <template v-for="(step, index) in timelineSteps" :key="step.key">
                <div class="flex items-center gap-2 shrink-0">
                  <div 
                    class="w-8 h-8 rounded-full flex items-center justify-center"
                    :class="step.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-400'"
                  >
                    <component :is="step.icon" class="w-3.5 h-3.5" />
                  </div>
                  <span 
                    class="text-xs font-medium whitespace-nowrap"
                    :class="step.completed ? 'text-stone-900' : 'text-stone-400'"
                  >
                    {{ step.label }}
                  </span>
                </div>
                <div 
                  v-if="index < timelineSteps.length - 1"
                  class="w-4 h-0.5 rounded-full shrink-0"
                  :class="timelineSteps[index + 1]?.completed ? 'bg-emerald-200' : 'bg-stone-200'"
                />
              </template>
            </div>
          </CardContent>
        </Card>

        <div class="grid gap-4 md:gap-6 lg:grid-cols-3">
          <!-- Order Items -->
          <Card class="lg:col-span-2 border-0 shadow-sm">
            <CardHeader class="p-4 md:p-6 pb-3 md:pb-4">
              <div class="flex items-center gap-2 md:gap-3">
                <div class="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-stone-100">
                  <Package class="w-4 h-4 md:w-5 md:h-5 text-stone-600" />
                </div>
                <CardTitle class="text-base md:text-lg">Order Items</CardTitle>
              </div>
            </CardHeader>
            <CardContent class="p-4 md:p-6 pt-0 md:pt-0">
              <div class="space-y-3 md:space-y-4">
                <NuxtLink 
                  v-for="item in order.items" 
                  :key="item.id"
                  :to="`/products/${item.productSlug}`"
                  class="flex flex-col gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl bg-stone-50/50 hover:bg-stone-100/50 transition-colors"
                >
                  <div class="flex items-start gap-3 md:gap-4 w-full">
                    <div class="w-16 h-16 md:w-20 md:h-20 rounded-lg md:rounded-xl bg-white border border-stone-200 overflow-hidden flex-shrink-0">
                      <img 
                        v-if="item.productImages?.[0]" 
                        :src="`/images/${item.productImages[0]}`" 
                        :alt="item.productName"
                        class="w-full h-full object-cover"
                      />
                      <div v-else class="w-full h-full flex items-center justify-center">
                        <Package class="w-6 h-6 md:w-8 md:h-8 text-stone-300" />
                      </div>
                    </div>
                    <div class="flex-1 min-w-0 pt-1">
                      <p class="text-sm md:text-base font-medium text-stone-900 line-clamp-1">{{ item.productName || 'Unknown Product' }}</p>
                      <p class="text-xs md:text-sm text-stone-500 mt-0.5 md:mt-1">Qty: {{ item.quantity }}</p>
                    </div>
                    <div class="text-right shrink-0 pt-1">
                      <p class="text-sm md:text-base font-semibold text-stone-900">{{ formatPrice(item.priceAtPurchase * item.quantity) }}</p>
                      <p class="text-[10px] md:text-xs text-stone-500">{{ formatPrice(item.priceAtPurchase) }} each</p>
                    </div>
                  </div>

                  <!-- Customer Review (if any) -->
                  <div v-if="item.review" class="mt-2 text-sm bg-white p-3 rounded-lg border border-border">
                    <div class="flex items-center gap-1 mb-1.5">
                      <Star 
                        v-for="i in 5" 
                        :key="i"
                        class="w-3.5 h-3.5"
                        :class="i <= item.review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'"
                      />
                      <span class="text-xs text-muted-foreground ml-2">Your review</span>
                    </div>
                    <p v-if="item.review.comment" class="text-muted-foreground text-xs italic">"{{ item.review.comment }}"</p>
                  </div>
                </NuxtLink>
              </div>

              <Separator class="my-4 md:my-6" />

              <!-- Order Summary -->
              <div class="space-y-2 md:space-y-3">
                <div class="flex justify-between text-xs md:text-sm">
                  <span class="text-stone-500">Subtotal</span>
                  <span class="text-stone-900">{{ formatPrice(order.subtotal) }}</span>
                </div>
                <div class="flex justify-between text-xs md:text-sm">
                  <span class="text-stone-500">Shipping</span>
                  <span class="text-emerald-600 font-medium">Free</span>
                </div>
                
                <div v-if="order.discountCode" class="flex justify-between text-xs md:text-sm text-emerald-600">
                  <span class="flex items-center gap-1.5 bg-emerald-500/10 px-2 rounded font-medium border border-emerald-500/20">
                    <Tag class="w-3.5 h-3.5" />
                    {{ order.discountCode.code }}
                  </span>
                  <span class="font-medium">-{{ formatPrice(order.discountAmount || 0) }}</span>
                </div>
                <Separator />
                <div class="flex justify-between font-semibold text-base md:text-lg">
                  <span class="text-stone-900">Total</span>
                  <span class="text-stone-900">{{ formatPrice(order.total) }}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Sidebar -->
          <div class="space-y-4 md:space-y-6">
            <!-- Shipping Address -->
            <Card v-if="shippingDetails" class="border-0 shadow-sm">
              <CardHeader class="p-4 md:p-6 pb-3 md:pb-4">
                <div class="flex items-center gap-2 md:gap-3">
                  <div class="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-violet-100">
                    <MapPin class="w-4 h-4 md:w-5 md:h-5 text-violet-600" />
                  </div>
                  <CardTitle class="text-base md:text-lg">Shipping Address</CardTitle>
                </div>
              </CardHeader>
              <CardContent class="p-4 md:p-6 pt-0 md:pt-0">
                <div class="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                  <p class="font-medium text-stone-900">{{ shippingDetails.name }}</p>
                  <p class="text-stone-600">{{ shippingDetails.address }}</p>
                  <p class="text-stone-600">{{ shippingDetails.city }}</p>
                  <div v-if="shippingDetails.phone" class="flex items-center gap-1.5 md:gap-2 pt-1.5 md:pt-2 text-stone-600">
                    <Phone class="w-3.5 h-3.5 md:w-4 md:h-4" />
                    {{ shippingDetails.phone }}
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Payment Info -->
            <Card v-if="order.payment" class="border-0 shadow-sm">
              <CardHeader class="p-4 md:p-6 pb-3 md:pb-4">
                <div class="flex items-center gap-2 md:gap-3">
                  <div class="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-emerald-100">
                    <CreditCard class="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                  </div>
                  <CardTitle class="text-base md:text-lg">Payment</CardTitle>
                </div>
              </CardHeader>
              <CardContent class="p-4 md:p-6 pt-0 md:pt-0 space-y-2 md:space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs md:text-sm text-stone-500">Status</span>
                  <Badge :class="[getPaymentConfig(order.paymentStatus).class, 'border text-[10px] md:text-xs']">
                    {{ getPaymentConfig(order.paymentStatus).label }}
                  </Badge>
                </div>
                <div v-if="order.payment" class="flex items-center justify-between">
                  <span class="text-xs md:text-sm text-stone-500">Method</span>
                  <span class="text-xs md:text-sm text-stone-700 capitalize">{{ order.payment.provider }}</span>
                </div>
              </CardContent>
            </Card>

            <!-- Need Help -->
            <Card class="border-0 shadow-sm bg-stone-900 text-white">
              <CardContent class="p-4 md:p-6">
                <h3 class="font-semibold text-sm md:text-base mb-1.5 md:mb-2">Need Help?</h3>
                <p class="text-xs md:text-sm text-stone-300 mb-3 md:mb-4">
                  Have questions about your order? We're here to help.
                </p>
                <Button variant="secondary" size="sm" as-child class="w-full h-9 md:h-10 text-xs md:text-sm">
                  <a href="mailto:support@lindisstore.com" class="flex items-center justify-center gap-1.5 md:gap-2">
                    <Mail class="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Contact Support
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
