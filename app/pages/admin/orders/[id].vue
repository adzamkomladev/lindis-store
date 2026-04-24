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
  Loader2,
  User,
  RefreshCw,
  Tag,
  Star
} from 'lucide-vue-next'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const orderId = route.params.id as string

const { data: order, pending, refresh } = await useFetch(`/api/admin/orders/${orderId}`)

const isUpdating = ref(false)

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

const statusConfig: Record<string, { icon: any, chipClass: string, label: string }> = {
  pending:    { icon: Clock,         chipClass: 'bg-amber-500/10 text-amber-700',    label: 'Pending' },
  processing: { icon: Package,       chipClass: 'bg-[#adc3fe] text-[#394f83]',      label: 'Processing' },
  shipped:    { icon: Truck,         chipClass: 'bg-violet-500/10 text-violet-700',  label: 'Shipped' },
  delivered:  { icon: CheckCircle2,  chipClass: 'bg-emerald-500/10 text-emerald-700',label: 'Delivered' },
  cancelled:  { icon: XCircle,       chipClass: 'bg-red-500/10 text-red-600',        label: 'Cancelled' }
}

const paymentStatusConfig: Record<string, { chipClass: string, label: string }> = {
  unpaid:   { chipClass: 'bg-amber-500/10 text-amber-700',     label: 'Unpaid' },
  paid:     { chipClass: 'bg-emerald-500/10 text-emerald-700', label: 'Paid' },
  refunded: { chipClass: 'bg-[#edeeef] text-[#757681]',        label: 'Refunded' }
}

const getStatusConfig = (status: string) => statusConfig[status] || statusConfig.pending
const getPaymentConfig = (status: string) => paymentStatusConfig[status] || paymentStatusConfig.unpaid

const { showSuccess, showError } = useAlertDialog()

const shippingDetails = computed(() => {
  if (!order.value?.shippingDetails) return null
  return order.value.shippingDetails as {
    name?: string
    phone?: string
    address?: string
    city?: string
  }
})

const updateOrderStatus = async (status: string) => {
  isUpdating.value = true
  try {
    await $fetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      body: { status }
    })
    await refresh()
  } catch (error) {
    showError('Update Failed', 'Failed to update order status')
  } finally {
    isUpdating.value = false
  }
}

const updatePaymentStatus = async (paymentStatus: string) => {
  isUpdating.value = true
  try {
    await $fetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      body: { paymentStatus }
    })
    await refresh()
  } catch (error) {
    showError('Update Failed', 'Failed to update payment status')
  } finally {
    isUpdating.value = false
  }
}

const isVerifying = ref(false)
const verifyPayment = async () => {
  if (!order.value?.payment?.reference) return
  
  isVerifying.value = true
  try {
    const result = await $fetch('/api/orders/verify-payment', {
      method: 'POST',
      body: {
        orderId: order.value.id,
        paymentReference: order.value.payment.reference
      }
    })
    
    if (result.status === 'success') {
      showSuccess('Already Verified', 'Payment has already been verified!')
    } else if (result.status === 'failed') {
      showError('Payment Failed', 'This payment has failed.')
    } else {
      showSuccess('Verification Queued', 'Payment verification has been queued. The page will refresh shortly.')
    }
    
    setTimeout(() => refresh(), 2000)
  } catch (error: any) {
    showError('Verification Failed', error.data?.message || 'Failed to verify payment')
  } finally {
    isVerifying.value = false
  }
}
</script>

<template>
  <div class="space-y-6 py-6">

    <!-- Page Header -->
    <div class="flex items-center gap-4">
      <NuxtLink 
        to="/admin/orders" 
        class="w-9 h-9 flex items-center justify-center border border-[#c5c6d1] text-[#757681] hover:text-[#000622] hover:bg-[#edeeef] transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
      </NuxtLink>
      <div>
        <p class="text-[#475d92] font-label font-bold uppercase tracking-[0.2em] text-xs mb-1">Fulfillment</p>
        <div class="flex items-center gap-3">
          <h2 class="font-headline font-black text-[#000622] tracking-tighter uppercase text-2xl">
            {{ pending ? 'Loading...' : order?.orderNumber }}
          </h2>
          <span 
            v-if="order"
            :class="[getStatusConfig(order.status).chipClass, 'px-2.5 py-1 text-[10px] font-label font-bold uppercase tracking-widest inline-flex items-center gap-1.5']"
          >
            <component :is="getStatusConfig(order.status).icon" class="w-3 h-3" />
            {{ getStatusConfig(order.status).label }}
          </span>
        </div>
        <p v-if="order" class="text-xs text-[#757681] font-body mt-0.5">
          Placed on {{ formatDate(order.createdAt) }}
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2 bg-white border border-[#c5c6d1]/20 p-6 space-y-4">
        <div class="animate-pulse h-5 w-32 bg-[#edeeef]" />
        <div class="animate-pulse h-20 w-full bg-[#edeeef]" />
        <div class="animate-pulse h-20 w-full bg-[#edeeef]" />
      </div>
      <div class="bg-white border border-[#c5c6d1]/20 p-6 space-y-4">
        <div class="animate-pulse h-5 w-24 bg-[#edeeef]" />
        <div class="animate-pulse h-10 w-full bg-[#edeeef]" />
      </div>
    </div>

    <!-- Order Content -->
    <div v-else-if="order" class="grid gap-6 lg:grid-cols-3">

      <!-- Left: Order Items -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white border border-[#c5c6d1]/20">
          <!-- Card Header -->
          <div class="flex items-center gap-3 px-6 py-5 border-b border-[#c5c6d1]/15">
            <div class="p-2 bg-[#adc3fe]">
              <Package class="w-4 h-4 text-[#394f83]" />
            </div>
            <div>
              <p class="text-xs font-label font-bold uppercase tracking-widest text-[#757681] mb-0.5">Contents</p>
              <h3 class="font-headline font-bold text-[#000622] tracking-tight">Order Items</h3>
            </div>
            <span class="ml-auto text-xs font-label font-bold uppercase tracking-widest text-[#757681]">
              {{ order.items?.length || 0 }} items
            </span>
          </div>

          <!-- Items list -->
          <div class="divide-y divide-[#c5c6d1]/10">
            <div 
              v-for="item in order.items" 
              :key="item.id"
              class="flex gap-4 p-5"
            >
              <div class="w-16 h-16 bg-[#f3f4f5] overflow-hidden shrink-0 flex items-center justify-center">
                <NuxtImg 
                  v-if="item.productImages?.[0]" 
                  :src="item.productImages[0]" 
                  :alt="item.productName"
                  class="w-full h-full object-cover"
                />
                <Package v-else class="w-6 h-6 text-[#c5c6d1]" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-label font-bold text-xs uppercase tracking-wide text-[#000622] truncate">
                  {{ item.productName || 'Unknown Product' }}
                </p>
                <p class="text-xs text-[#757681] font-body mt-0.5">Qty: {{ item.quantity }}</p>
                <p v-if="item.customText" class="text-[10px] text-[#475d92] font-label font-bold uppercase tracking-widest mt-1">
                  Custom Text: "{{ item.customText }}"
                </p>
                <!-- Customer Review -->
                <div v-if="item.review" class="mt-2 p-3 bg-[#f8f9fa] border border-[#c5c6d1]/20">
                  <div class="flex items-center gap-1 mb-1">
                    <Star 
                      v-for="i in 5" 
                      :key="i"
                      class="w-3 h-3"
                      :class="i <= item.review.rating ? 'text-amber-400 fill-amber-400' : 'text-[#c5c6d1]'"
                    />
                    <span class="text-[10px] text-[#757681] font-body ml-2 font-label uppercase tracking-widest">Customer review</span>
                  </div>
                  <p v-if="item.review.comment" class="text-xs text-[#757681] font-body italic">"{{ item.review.comment }}"</p>
                </div>
              </div>
              <div class="text-right shrink-0">
                <p class="font-label font-bold text-sm text-[#000622]">{{ formatPrice(item.priceAtPurchase * item.quantity) }}</p>
                <p class="text-[10px] text-[#757681] font-body mt-0.5">{{ formatPrice(item.priceAtPurchase) }} each</p>
              </div>
            </div>
          </div>

          <!-- Totals -->
          <div class="border-t border-[#c5c6d1]/15 px-6 py-5 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-[#757681] font-body">Subtotal</span>
              <span class="font-label font-bold text-[#000622]">{{ formatPrice(order.subtotal) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-[#757681] font-body">Shipping</span>
              <span class="font-label font-bold text-[#000622]">Free</span>
            </div>
            <div v-if="order.discountCode" class="flex justify-between text-sm">
              <span class="inline-flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 text-emerald-700 text-[10px] font-label font-bold uppercase tracking-widest">
                <Tag class="w-3 h-3" />
                {{ order.discountCode.code }}
              </span>
              <span class="font-label font-bold text-emerald-700">-{{ formatPrice(order.discountAmount || 0) }}</span>
            </div>
            <div class="flex justify-between border-t border-[#c5c6d1]/15 pt-3 mt-3">
              <span class="font-label font-bold text-sm text-[#000622] uppercase tracking-widest">Total</span>
              <span class="font-headline font-black text-[#000622] tracking-tighter text-lg">{{ formatPrice(order.total) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Sidebar -->
      <div class="space-y-4">

        <!-- Update Status -->
        <div class="bg-white border border-[#c5c6d1]/20">
          <div class="px-6 py-4 border-b border-[#c5c6d1]/15">
            <p class="text-xs font-label font-bold uppercase tracking-widest text-[#757681] mb-0.5">Management</p>
            <h3 class="font-headline font-bold text-[#000622] tracking-tight">Update Status</h3>
          </div>
          <div class="px-6 py-5 space-y-4">
            <div class="space-y-2">
              <label class="text-[10px] font-label font-bold uppercase tracking-widest text-[#757681] block">Order Status</label>
              <Select 
                :model-value="order.status" 
                @update:model-value="updateOrderStatus"
                :disabled="isUpdating"
              >
                <SelectTrigger class="h-10 border-[#c5c6d1] text-xs font-label uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-label font-bold uppercase tracking-widest text-[#757681] block">Payment Status</label>
              <Select 
                :model-value="order.paymentStatus" 
                @update:model-value="updatePaymentStatus"
                :disabled="isUpdating"
              >
                <SelectTrigger class="h-10 border-[#c5c6d1] text-xs font-label uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div v-if="isUpdating" class="flex items-center justify-center gap-2 py-2 text-xs text-[#757681] font-body">
              <Loader2 class="w-3.5 h-3.5 animate-spin" /> Updating...
            </div>
          </div>
        </div>

        <!-- Customer -->
        <div class="bg-white border border-[#c5c6d1]/20">
          <div class="px-6 py-4 border-b border-[#c5c6d1]/15">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-[#adc3fe]">
                <User class="w-4 h-4 text-[#394f83]" />
              </div>
              <div>
                <p class="text-xs font-label font-bold uppercase tracking-widest text-[#757681] mb-0.5">Details</p>
                <h3 class="font-headline font-bold text-[#000622] tracking-tight">Customer</h3>
              </div>
            </div>
          </div>
          <div class="px-6 py-5 space-y-3">
            <div class="flex items-center gap-3">
              <Mail class="w-4 h-4 text-[#c5c6d1] shrink-0" />
              <span class="text-sm text-[#454650] font-body truncate">{{ order.guestEmail }}</span>
            </div>
            <div v-if="shippingDetails?.phone" class="flex items-center gap-3">
              <Phone class="w-4 h-4 text-[#c5c6d1] shrink-0" />
              <span class="text-sm text-[#454650] font-body">{{ shippingDetails.phone }}</span>
            </div>
          </div>
        </div>

        <!-- Shipping Address -->
        <div v-if="shippingDetails" class="bg-white border border-[#c5c6d1]/20">
          <div class="px-6 py-4 border-b border-[#c5c6d1]/15">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-violet-500/10">
                <MapPin class="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p class="text-xs font-label font-bold uppercase tracking-widest text-[#757681] mb-0.5">Delivery</p>
                <h3 class="font-headline font-bold text-[#000622] tracking-tight">Shipping Address</h3>
              </div>
            </div>
          </div>
          <div class="px-6 py-5">
            <div class="space-y-1 text-sm font-body">
              <p class="font-label font-bold text-xs uppercase tracking-wide text-[#000622]">{{ shippingDetails.name }}</p>
              <p class="text-[#757681]">{{ shippingDetails.address }}</p>
              <p class="text-[#757681]">{{ shippingDetails.city }}</p>
            </div>
          </div>
        </div>

        <!-- Payment Info -->
        <div v-if="order.payment" class="bg-white border border-[#c5c6d1]/20">
          <div class="px-6 py-4 border-b border-[#c5c6d1]/15">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-emerald-500/10">
                <CreditCard class="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p class="text-xs font-label font-bold uppercase tracking-widest text-[#757681] mb-0.5">Transaction</p>
                <h3 class="font-headline font-bold text-[#000622] tracking-tight">Payment</h3>
              </div>
            </div>
          </div>
          <div class="px-6 py-5 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs text-[#757681] font-body">Provider</span>
              <span class="px-2.5 py-1 border border-[#c5c6d1] text-[10px] font-label font-bold uppercase tracking-widest text-[#454650]">
                {{ order.payment.provider }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-[#757681] font-body">Reference</span>
              <span class="text-xs font-mono text-[#757681]">{{ order.payment.reference }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-[#757681] font-body">Status</span>
              <span :class="[getPaymentConfig(order.paymentStatus).chipClass, 'px-2.5 py-1 text-[10px] font-label font-bold uppercase tracking-widest']">
                {{ getPaymentConfig(order.paymentStatus).label }}
              </span>
            </div>
            
            <!-- Verify Payment Button -->
            <button 
              v-if="order.payment.status === 'pending'"
              class="w-full mt-2 py-2.5 border border-[#c5c6d1] text-[#000622] font-label font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-[#edeeef] transition-colors disabled:opacity-60"
              :disabled="isVerifying"
              @click="verifyPayment"
            >
              <Loader2 v-if="isVerifying" class="w-3.5 h-3.5 animate-spin" />
              <RefreshCw v-else class="w-3.5 h-3.5" />
              {{ isVerifying ? 'Verifying...' : 'Verify Payment' }}
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="bg-white border border-[#c5c6d1]/20 p-16 text-center">
      <Package class="w-10 h-10 text-[#c5c6d1] mx-auto mb-4" />
      <h3 class="font-headline font-bold text-[#000622] uppercase tracking-tight mb-2">Order Not Found</h3>
      <p class="text-sm text-[#757681] font-body">This order could not be found or may have been deleted.</p>
      <NuxtLink to="/admin/orders" class="mt-6 inline-flex items-center gap-2 px-5 py-2.5 border border-[#c5c6d1] text-[#000622] font-label font-bold uppercase text-xs tracking-widest hover:bg-[#edeeef] transition-colors">
        <ArrowLeft class="w-3.5 h-3.5" /> Back to Orders
      </NuxtLink>
    </div>

  </div>
</template>
