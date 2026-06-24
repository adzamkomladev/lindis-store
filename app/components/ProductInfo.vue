<script setup lang="ts">
import { Minus, Plus, Check, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  product: any
}>()

const { addToCart } = useCart()
const { showSuccess } = useAlertDialog()
const quantity = ref(1)
const addedToCart = ref(false)
const selectedVolume = ref<string | null>(null)

const inStock = computed(() => props.product.inventoryCount > 0)
const lowStock = computed(() => props.product.inventoryCount > 0 && props.product.inventoryCount <= 5)

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS'
  }).format(amount / 100)
}

const handleAddToCart = () => {
  if (!inStock.value) return
  addToCart(props.product, quantity.value)
  addedToCart.value = true
  showSuccess('Added to Cart', `${quantity.value}x ${props.product.name} has been added to your cart.`)
  setTimeout(() => {
    addedToCart.value = false
  }, 2000)
}

// Parse volume options from specCapacity (e.g., "500ml, 750ml")
const volumeOptions = computed(() => {
  if (!props.product.specCapacity) return []
  return props.product.specCapacity.split(',').map((v: string) => v.trim()).filter(Boolean)
})

// Set default volume
onMounted(() => {
  if (volumeOptions.value.length) selectedVolume.value = volumeOptions.value[0]
})
</script>

<template>
  <div class="flex flex-col monolith-axis">
    <!-- Series Label + Name -->
    <header class="mb-10">
      <span class="font-label uppercase text-primary tracking-[0.2em] text-xs font-bold mb-4 block">
        The Monolith Series
      </span>
      <h1 class="font-headline font-black tracking-tighter leading-none text-on-surface mb-6 uppercase" style="font-size: clamp(2rem, 4vw, 3.5rem)">
        {{ product.name }}
      </h1>
      <p class="text-on-surface-variant text-lg leading-relaxed max-w-md font-body">
        {{ product.description }}
      </p>
    </header>

    <!-- Eco-stat chips -->
    <div class="flex flex-wrap gap-3 mb-10">
      <span class="px-4 py-1.5 rounded-full bg-[#adc3fe] text-primary text-xs font-bold font-label uppercase tracking-wide">BPA-Free Shell</span>
      <span v-if="product.specInsulation" class="px-4 py-1.5 rounded-full bg-[#adc3fe] text-primary text-xs font-bold font-label uppercase tracking-wide">
        {{ product.specInsulation }}
      </span>
      <span class="px-4 py-1.5 rounded-full bg-[#adc3fe] text-primary text-xs font-bold font-label uppercase tracking-wide">Lifetime Guarantee</span>
    </div>

    <!-- Volume Selector -->
    <div v-if="volumeOptions.length > 0" class="space-y-4 mb-8 pb-6 border-b border-outline-variant">
      <span class="font-label text-xs uppercase text-on-surface-variant tracking-widest block">Volume</span>
      <div class="flex gap-4 flex-wrap">
        <button
          v-for="vol in volumeOptions"
          :key="vol"
          @click="selectedVolume = vol"
          class="px-6 py-2 border text-sm font-bold font-label uppercase tracking-wide transition-colors"
          :class="selectedVolume === vol
            ? 'border-primary bg-primary text-white'
            : 'border-outline-variant text-on-surface-variant hover:border-primary'"
        >
          {{ vol }}
        </button>
      </div>
    </div>

    <!-- Technical Specs -->
    <div class="mb-10 pb-6 border-b border-outline-variant">
      <span class="font-label text-xs uppercase text-on-surface-variant tracking-widest block mb-4">Technical Specs</span>
      <ul class="space-y-3 font-label text-sm text-on-surface-variant">
        <li v-if="product.specMaterial" class="flex justify-between">
          <span>Material</span>
          <span class="text-on-surface font-bold">{{ product.specMaterial }}</span>
        </li>
        <li v-if="product.specCapacity" class="flex justify-between">
          <span>Capacity</span>
          <span class="text-on-surface font-bold">{{ product.specCapacity }}</span>
        </li>
        <li v-if="product.specWeight" class="flex justify-between">
          <span>Weight</span>
          <span class="text-on-surface font-bold">{{ product.specWeight }}</span>
        </li>
        <li v-if="product.specDimensions" class="flex justify-between">
          <span>Dimensions</span>
          <span class="text-on-surface font-bold">{{ product.specDimensions }}</span>
        </li>
        <li v-if="product.specTempRetention" class="flex justify-between">
          <span>Temp Retention</span>
          <span class="text-on-surface font-bold">{{ product.specTempRetention }}</span>
        </li>
      </ul>
    </div>

    <!-- Quantity -->
    <div v-if="inStock" class="flex items-center gap-4 mb-8">
      <span class="font-label text-xs uppercase text-on-surface-variant tracking-widest">Qty</span>
      <div class="flex items-center border border-outline-variant/50">
        <button
          @click="quantity = Math.max(1, quantity - 1)"
          class="px-4 py-2 text-on-surface hover:bg-surface-container-low transition-colors"
        >
          <Minus class="w-4 h-4" />
        </button>
        <span class="px-6 font-bold text-sm font-label text-on-surface">{{ String(quantity).padStart(2, '0') }}</span>
        <button
          @click="quantity = Math.min(product.inventoryCount, quantity + 1)"
          class="px-4 py-2 text-on-surface hover:bg-surface-container-low transition-colors"
        >
          <Plus class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Out of Stock Alert -->
    <div v-if="!inStock" class="flex items-center gap-3 p-4 bg-red-50 mb-8">
      <AlertCircle class="w-5 h-5 text-red-600 shrink-0" />
      <div>
        <p class="font-bold text-red-900 text-sm font-label uppercase tracking-wide">Currently Unavailable</p>
        <p class="text-xs text-red-700 font-body mt-0.5">This product is out of stock. Check back later.</p>
      </div>
    </div>

    <!-- Pricing -->
    <div class="flex items-baseline gap-4 mb-6">
      <span class="font-headline font-black text-on-surface tracking-tighter" style="font-size: 2.5rem">
        {{ formatPrice(product.price) }}
      </span>
    </div>

    <!-- Add to Cart CTA -->
    <button
      @click="handleAddToCart"
      :disabled="addedToCart || !inStock"
      class="w-full py-6 font-label font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
      :class="!inStock ? 'bg-surface-container-low text-on-surface-variant cursor-not-allowed' : addedToCart ? 'bg-primary text-white' : 'monolith-gradient text-white hover:opacity-90'"
    >
      <Check v-if="addedToCart" class="w-5 h-5" />
      <span>{{ !inStock ? 'Out of Stock' : addedToCart ? 'Added to Cart!' : 'Add to Cart' }}</span>
      <span v-if="!addedToCart && inStock" class="material-symbols-outlined text-lg">arrow_forward</span>
    </button>

    <p class="mt-6 text-center text-xs text-on-surface-variant font-label uppercase tracking-tighter">
      Free express shipping on orders over GHS 100
    </p>

    <!-- Trust badges -->
    <div class="mt-8 pt-6 border-t border-outline-variant space-y-3">
      <div class="flex items-center gap-3 text-xs font-body text-on-surface-variant">
        <span class="material-symbols-outlined text-primary text-lg">local_shipping</span>
        Free delivery in Ghana
      </div>
      <div class="flex items-center gap-3 text-xs font-body text-on-surface-variant">
        <span class="material-symbols-outlined text-primary text-lg">verified</span>
        30-day return policy
      </div>
      <div class="flex items-center gap-3 text-xs font-body text-on-surface-variant">
        <span class="material-symbols-outlined text-primary text-lg">lock</span>
        Secure payments via Paystack
        <NuxtImg src="/img/paystack-logo.png" alt="Paystack" class="h-4 w-auto" />
      </div>
    </div>
  </div>
</template>
