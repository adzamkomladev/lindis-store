<script setup lang="ts">
import { ArrowRight, Mail, Package, Share2 } from 'lucide-vue-next'

const route = useRoute()
const orderId = route.query.id

const { clearCart } = useCart()

const showConfetti = ref(true)

// Monolith palette confetti: navy blues and teals
const confettiColors = ['bg-[#b1c6ff]', 'bg-[#adc3fe]', 'bg-[#475d92]', 'bg-[#000622]', 'bg-[#394f83]', 'bg-[#e1e3e4]']

onMounted(() => {
  clearCart()
  setTimeout(() => {
    showConfetti.value = false
  }, 5000)
})

const shareUrl = computed(() => typeof window !== 'undefined' ? window.location.origin : '')
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fa] flex items-center justify-center relative overflow-hidden">

    <!-- Monolith-palette Confetti -->
    <div v-if="showConfetti" class="fixed inset-0 pointer-events-none z-50">
      <div
        v-for="i in 50"
        :key="i"
        :class="[confettiColors[i % confettiColors.length], 'absolute w-2 h-2 confetti-piece']"
        :style="{
          left: `${(i * 2.1) % 100}%`,
          animationDelay: `${(i * 0.07) % 3}s`,
          animationDuration: `${2 + (i % 3)}s`
        }"
      />
    </div>

    <!-- Content Panel -->
    <div class="relative z-10 max-w-2xl w-full mx-auto px-8 py-24">

      <!-- Top: Order Received -->
      <div class="monolith-gradient p-12 md:p-16 text-center text-white mb-0">
        <!-- Checkmark icon -->
        <div class="w-16 h-16 bg-white/20 flex items-center justify-center mx-auto mb-8">
          <span class="material-symbols-outlined text-white text-3xl" style="font-variation-settings: 'FILL' 1">check_circle</span>
        </div>

        <p class="font-label font-bold uppercase tracking-[0.2em] text-[#b1c6ff] text-xs mb-4">Order Confirmed</p>
        <h1 class="font-headline font-black tracking-tighter leading-none mb-4" style="font-size: clamp(2.5rem, 5vw, 4rem)">
          Thank You.
        </h1>
        <p class="text-white/70 font-body text-lg mb-3">
          Your order has been received and is being prepared.
        </p>
        <p v-if="orderId" class="font-label font-bold text-[#b1c6ff] text-sm tracking-widest uppercase">
          Order #{{ orderId }}
        </p>
      </div>

      <!-- Bottom: What's Next -->
      <div class="bg-white border border-[#c5c6d1]/20 p-8 md:p-10">
        <h2 class="font-headline font-bold text-[#000622] tracking-tight mb-8 text-xl">What Happens Next</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 bg-[#f3f4f5] flex items-center justify-center shrink-0">
              <Mail class="w-5 h-5 text-[#475d92]" />
            </div>
            <div>
              <p class="font-label font-bold uppercase tracking-wide text-sm text-[#000622]">Confirmation Sent</p>
              <p class="text-xs text-[#454650] font-body mt-1">Check your email inbox for full order details.</p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="w-10 h-10 bg-[#f3f4f5] flex items-center justify-center shrink-0">
              <Package class="w-5 h-5 text-[#475d92]" />
            </div>
            <div>
              <p class="font-label font-bold uppercase tracking-wide text-sm text-[#000622]">Now Processing</p>
              <p class="text-xs text-[#454650] font-body mt-1">Your items are being carefully packed for dispatch.</p>
            </div>
          </div>
        </div>

        <!-- Share Row -->
        <div class="mb-10 pb-10 border-b border-[#c5c6d1]/15">
          <div class="flex items-center gap-2 mb-4">
            <Share2 class="w-4 h-4 text-[#757681]" />
            <span class="font-label font-bold uppercase tracking-widest text-xs text-[#757681]">Share your purchase</span>
          </div>
          <div class="flex gap-4">
            <a
              :href="`https://twitter.com/intent/tweet?text=${encodeURIComponent('I just ordered from Lindi\'s Store! 🎉')}&url=${shareUrl}`"
              target="_blank" rel="noopener noreferrer"
              class="w-10 h-10 bg-[#000622] flex items-center justify-center text-white text-xs font-bold font-label hover:opacity-80 transition-opacity"
              aria-label="Share on Twitter"
            >𝕏</a>
            <a
              :href="`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`"
              target="_blank" rel="noopener noreferrer"
              class="w-10 h-10 bg-[#475d92] flex items-center justify-center text-white text-xs font-bold font-label hover:opacity-80 transition-opacity"
              aria-label="Share on Facebook"
            >f</a>
            <a
              :href="`https://wa.me/?text=${encodeURIComponent('I just ordered from Lindi\'s Store! 🎉 ' + shareUrl)}`"
              target="_blank" rel="noopener noreferrer"
              class="w-10 h-10 bg-emerald-600 flex items-center justify-center text-white hover:opacity-80 transition-opacity"
              aria-label="Share on WhatsApp"
            >
              <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1">chat</span>
            </a>
          </div>
        </div>

        <!-- CTA -->
        <NuxtLink
          to="/products"
          class="inline-flex items-center gap-3 monolith-gradient px-10 py-5 text-white font-label font-bold uppercase text-sm tracking-widest hover:opacity-90 transition-opacity"
        >
          Continue Shopping
          <ArrowRight class="w-4 h-4" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes confetti-fall {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
.confetti-piece {
  animation: confetti-fall linear forwards;
  position: absolute;
  width: 8px;
  height: 8px;
}
</style>
