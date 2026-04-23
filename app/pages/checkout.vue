<script setup lang="ts">
import { Lock, ShieldCheck, Check, Loader2, Tag, X } from "lucide-vue-next";
import CheckoutForm from "@/components/checkout/CheckoutForm.vue";
import CheckoutItems from "@/components/checkout/CheckoutItems.vue";
import { Separator } from "@/components/ui/separator";

const { cart, cartTotal, clearCart } = useCart();
const isSubmitting = ref(false);
const { showError } = useAlertDialog();

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(amount / 100);
};

const discountCodeInput = ref("");
const appliedDiscount = ref<any>(null);
const isApplyingDiscount = ref(false);
const discountError = ref("");

const applyDiscount = async () => {
  if (!discountCodeInput.value.trim()) return;
  isApplyingDiscount.value = true;
  discountError.value = "";

  try {
    const res = await $fetch('/api/discount-codes/validate', {
      method: "POST",
      body: {
        code: discountCodeInput.value.trim(),
        cartTotal: cartTotal.value,
        cartQuantity: cart.value.items.reduce((acc, item) => acc + item.quantity, 0),
        productIds: cart.value.items.map(i => i.id)
      }
    });

    appliedDiscount.value = res;
    discountCodeInput.value = "";
  } catch (err: any) {
    discountError.value = err.data?.message || "Invalid discount code";
  } finally {
    isApplyingDiscount.value = false;
  }
};

const removeDiscount = () => {
  appliedDiscount.value = null;
  discountError.value = "";
};

const finalTotal = computed(() => {
  if (!appliedDiscount.value) return cartTotal.value;
  return Math.max(0, cartTotal.value - (appliedDiscount.value.discountAmount || 0));
});

const handleCheckout = async (values: any) => {
  if (cart.value.items.length === 0) return;
  isSubmitting.value = true;

  try {
    const { url } = await $fetch("/api/orders/initiate", {
      method: "POST",
      body: {
        ...values,
        items: cart.value.items,
        discountCode: appliedDiscount.value?.code || undefined,
      },
    });
    clearCart();
    window.location.href = url;
  } catch (error) {
    showError(
      "Checkout Failed",
      "Failed to initiate checkout. Please try again.",
    );
  } finally {
    isSubmitting.value = false;
  }
};

useSeoMeta({
  title: "Checkout | Lindi's Store",
});

// Redirect if cart is empty
if (import.meta.client && cart.value.items.length === 0) {
  navigateTo("/cart");
}
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fa]">

    <!-- Editorial Page Header -->
    <section class="pt-32 pb-10 px-8 max-w-screen-2xl mx-auto border-b border-[#c5c6d1]/20">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <span class="text-[#475d92] font-label font-bold uppercase tracking-[0.2em] text-xs mb-2 block">Secure Checkout</span>
          <h1 class="font-headline font-black tracking-tighter text-[#000622] leading-none" style="font-size: clamp(2.25rem, 5vw, 3.5rem)">
            Checkout
          </h1>
        </div>

        <!-- Checkout Steps -->
        <div class="flex items-center gap-3">
          <!-- Step 1: Cart (done) -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-[#000622] text-white flex items-center justify-center shrink-0">
              <Check class="w-4 h-4" />
            </div>
            <span class="text-xs font-bold uppercase tracking-widest font-label hidden sm:inline text-[#000622]">Cart</span>
          </div>
          <div class="w-8 h-px bg-[#000622]"></div>
          <!-- Step 2: Shipping (active) -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-[#000622] text-white flex items-center justify-center text-xs font-bold shrink-0 font-label">2</div>
            <span class="text-xs font-bold uppercase tracking-widest font-label hidden sm:inline text-[#000622]">Shipping</span>
          </div>
          <div class="w-8 h-px bg-[#c5c6d1]"></div>
          <!-- Step 3: Payment (pending) -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 border border-[#c5c6d1] text-[#757681] flex items-center justify-center text-xs font-bold shrink-0 font-label">3</div>
            <span class="text-xs font-bold uppercase tracking-widest font-label hidden sm:inline text-[#757681]">Payment</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Content -->
    <div class="px-8 max-w-screen-2xl mx-auto py-12">
      <div class="grid lg:grid-cols-12 gap-12 max-w-6xl">

        <!-- Form: 7 columns -->
        <div class="lg:col-span-7 order-2 lg:order-1">
          <div class="bg-white border border-[#c5c6d1]/15 p-8 md:p-10">
            <CheckoutForm
              :is-submitting="isSubmitting"
              @submit="handleCheckout"
            >
              <template #default="{ isSubmitting: submitting }">
                <div class="pt-8 space-y-4 border-t border-[#c5c6d1]/20">
                  <button
                    type="submit"
                    :disabled="submitting"
                    class="w-full py-5 font-label font-bold uppercase tracking-widest text-sm text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    :class="submitting ? 'bg-[#475d92]' : 'monolith-gradient'"
                  >
                    <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
                    <Lock v-else class="w-4 h-4" />
                    {{ submitting ? "Processing Payment..." : "Proceed to Payment" }}
                    <span v-if="!submitting" class="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>

                  <div class="flex items-center justify-center gap-2 text-xs text-[#757681] font-body">
                    <ShieldCheck class="w-4 h-4" />
                    <span>Secure checkout powered by</span>
                    <NuxtImg
                      src="/img/paystack-logo.png"
                      alt="Paystack"
                      class="h-4 w-auto opacity-70"
                    />
                  </div>
                </div>
              </template>
            </CheckoutForm>
          </div>
        </div>

        <!-- Summary: 5 columns, sticky -->
        <div class="lg:col-span-5 order-1 lg:order-2">
          <div class="bg-[#f3f4f5] p-8 md:p-10 lg:sticky lg:top-28">
            <h2 class="font-headline font-bold text-[#000622] mb-8 tracking-tight" style="font-size: 1.25rem">
              Order Summary
            </h2>

            <CheckoutItems :items="cart.items" />

            <div class="mt-8 pt-6 border-t border-[#c5c6d1]/20 space-y-4">
              <div class="flex justify-between text-sm font-body">
                <span class="text-[#454650]">Subtotal</span>
                <span class="font-bold text-[#000622]">{{ formatPrice(cartTotal) }}</span>
              </div>
              <div class="flex justify-between text-sm font-body">
                <span class="text-[#454650]">Shipping</span>
                <span class="font-bold text-emerald-600">
                  {{ appliedDiscount?.type === 'free_shipping' ? 'FREE (Discount)' : 'FREE' }}
                </span>
              </div>
              <div v-if="appliedDiscount" class="flex justify-between text-sm text-emerald-600">
                <span class="flex items-center gap-1 font-body">
                  <Tag class="w-3.5 h-3.5" />
                  Discount ({{ appliedDiscount.code }})
                </span>
                <span class="font-bold">-{{ formatPrice(appliedDiscount.discountAmount || 0) }}</span>
              </div>
            </div>

            <!-- Total -->
            <div class="mt-6 pt-6 border-t border-[#c5c6d1]/30 flex justify-between items-end">
              <span class="font-headline font-bold text-[#000622] text-lg">Total</span>
              <div class="text-right">
                <span class="block text-[10px] text-[#454650] uppercase font-bold tracking-widest font-label">GHS</span>
                <span class="font-headline font-black text-[#000622] tracking-tighter" style="font-size: 2rem">
                  {{ formatPrice(finalTotal) }}
                </span>
              </div>
            </div>

            <!-- Discount Code -->
            <div class="mt-8 pt-6 border-t border-[#c5c6d1]/20">
              <span class="font-label text-xs uppercase text-[#757681] tracking-widest block mb-4">Discount Code</span>

              <div v-if="appliedDiscount" class="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200">
                <div class="flex items-center gap-2">
                  <Tag class="w-4 h-4 text-emerald-600" />
                  <div>
                    <p class="text-sm font-bold text-emerald-700 font-label">{{ appliedDiscount.code }}</p>
                    <p class="text-xs text-emerald-600/80 font-body">{{ appliedDiscount.description || 'Discount applied' }}</p>
                  </div>
                </div>
                <button @click="removeDiscount" class="text-emerald-700 hover:text-emerald-900 transition-colors">
                  <X class="w-4 h-4" />
                </button>
              </div>

              <div v-else class="flex gap-0">
                <input
                  v-model="discountCodeInput"
                  placeholder="ENTER CODE"
                  class="flex-1 bg-transparent border border-[#c5c6d1] border-r-0 px-4 py-3 text-sm uppercase font-label font-bold tracking-widest focus:outline-none focus:border-[#000622] transition-colors placeholder:text-[#c5c6d1] placeholder:font-bold"
                  @keyup.enter="applyDiscount"
                  :disabled="isApplyingDiscount"
                />
                <button
                  @click="applyDiscount"
                  :disabled="isApplyingDiscount || !discountCodeInput.trim()"
                  class="px-5 py-3 bg-[#000622] text-white text-xs font-bold uppercase tracking-widest font-label hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  <Loader2 v-if="isApplyingDiscount" class="w-4 h-4 animate-spin" />
                  <span v-else>Apply</span>
                </button>
              </div>
              <p v-if="discountError" class="text-xs text-red-600 mt-2 font-body">{{ discountError }}</p>
            </div>

            <!-- Payment Methods -->
            <div class="mt-6 pt-6 border-t border-[#c5c6d1]/20">
              <span class="font-label text-xs uppercase text-[#757681] tracking-widest block mb-3">Accepted Payments</span>
              <div class="flex items-center gap-3">
                <div class="px-3 py-1.5 bg-[#edeeef] text-xs font-bold text-[#454650] font-label uppercase tracking-wide">Visa</div>
                <div class="px-3 py-1.5 bg-[#edeeef] text-xs font-bold text-[#454650] font-label uppercase tracking-wide">Mastercard</div>
                <div class="px-3 py-1.5 bg-[#edeeef] text-xs font-bold text-[#454650] font-label uppercase tracking-wide">MoMo</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
