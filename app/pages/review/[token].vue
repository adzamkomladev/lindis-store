<script setup lang="ts">
import { Star, Package, CheckCircle2, AlertCircle, Loader2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const route = useRoute()
const token = route.params.token as string

definePageMeta({ layout: false })

useSeoMeta({
  title: "Share Your Review | Lindi's Store",
  description: "Share your experience with Lindi's Store products",
})

// Validate token and get order items
const { data: tokenData, pending, error } = await useFetch(`/api/reviews/validate`, {
  query: { token }
})

// Per-item review state (rating + text)
const itemReviews = ref<Record<number, { rating: number; title: string; comment: string }>>({})

// Initialize reviews from items once loaded
watchEffect(() => {
  if (tokenData.value?.valid && tokenData.value.items) {
    for (const item of tokenData.value.items) {
      if (!itemReviews.value[item.id]) {
        itemReviews.value[item.id] = { rating: 0, title: '', comment: '' }
      }
    }
  }
})

const isSubmitting = ref(false)
const submitSuccess = ref(false)
const submitError = ref('')

const setRating = (itemId: number, rating: number) => {
  if (itemReviews.value[itemId]) {
    itemReviews.value[itemId].rating = rating
  }
}

const submitReviews = async () => {
  if (!tokenData.value?.items) return

  // Validate at least one has a rating
  const hasRated = tokenData.value.items.some(item => (itemReviews.value[item.id]?.rating || 0) > 0)
  if (!hasRated) {
    submitError.value = 'Please rate at least one product before submitting.'
    return
  }

  isSubmitting.value = true
  submitError.value = ''

  try {
    const reviews = tokenData.value.items
      .filter(item => (itemReviews.value[item.id]?.rating || 0) > 0)
      .map(item => ({
        orderItemId: item.id,
        productId: item.productId,
        rating: itemReviews.value[item.id].rating,
        title: itemReviews.value[item.id].title || undefined,
        comment: itemReviews.value[item.id].comment || undefined,
      }))

    await $fetch('/api/reviews/submit', {
      method: 'POST',
      body: { token, reviews }
    })

    submitSuccess.value = true
  } catch (err: any) {
    submitError.value = err.data?.message || 'Something went wrong. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount / 100)
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-2xl">
      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-2">
          <NuxtImg src="/img/normal-logo.png" alt="Lindi's Store" class="h-8 w-auto dark:hidden" />
          <NuxtImg src="/img/dark-bg-logo.png" alt="Lindi's Store" class="h-8 w-auto hidden dark:block" />
        </NuxtLink>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="text-center py-16">
        <Loader2 class="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p class="text-muted-foreground">Loading your review form...</p>
      </div>

      <!-- Error (token invalid) -->
      <div v-else-if="error || !tokenData?.valid" class="text-center py-16 px-6 bg-card border border-border rounded-2xl">
        <div class="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle class="w-8 h-8 text-destructive" />
        </div>
        <h1 class="font-serif text-2xl font-bold text-foreground mb-2">Link not valid</h1>
        <p class="text-muted-foreground">
          <template v-if="tokenData?.reason === 'expired'">
            This review link has expired. Review links are valid for 7 days after delivery.
          </template>
          <template v-else-if="tokenData?.reason === 'used'">
            You've already submitted your review. Thank you!
          </template>
          <template v-else>
            This review link is invalid or no longer available.
          </template>
        </p>
        <NuxtLink to="/" class="inline-block mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
          Back to Shop
        </NuxtLink>
      </div>

      <!-- Success -->
      <div v-else-if="submitSuccess" class="text-center py-16 px-6 bg-card border border-border rounded-2xl">
        <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 class="w-8 h-8 text-primary" />
        </div>
        <h1 class="font-serif text-2xl font-bold text-foreground mb-2">Thank you!</h1>
        <p class="text-muted-foreground">Your review has been submitted. We truly appreciate your feedback.</p>
        <NuxtLink to="/" class="inline-block mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
          Continue Shopping
        </NuxtLink>
      </div>

      <!-- Review Form -->
      <div v-else class="space-y-6">
        <div class="text-center">
          <h1 class="font-serif text-3xl font-bold text-foreground">Share Your Experience</h1>
          <p class="text-muted-foreground mt-2">Rate the products from your recent order</p>
        </div>

        <div class="space-y-4">
          <div
            v-for="item in tokenData.items"
            :key="item.id"
            class="bg-card border border-border rounded-2xl p-5"
          >
            <!-- Item info -->
            <div class="flex items-center gap-3 mb-4">
              <div class="w-14 h-14 rounded-xl border border-border overflow-hidden bg-muted flex-shrink-0">
                <NuxtImg
                  v-if="item.productImages?.[0]"
                  :src="item.productImages[0]"
                  :alt="item.productName"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <Package class="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
              <div>
                <p class="font-semibold text-foreground">{{ item.productName }}</p>
                <p class="text-sm text-muted-foreground">{{ formatPrice(item.priceAtPurchase) }}</p>
              </div>
            </div>

            <!-- Star rating -->
            <div class="mb-4">
              <p class="text-sm font-medium text-foreground mb-2">Your rating</p>
              <div class="flex items-center gap-1">
                <button
                  v-for="i in 5"
                  :key="i"
                  type="button"
                  @click="setRating(item.id, i)"
                  class="transition-transform hover:scale-110"
                >
                  <Star
                    class="w-7 h-7 transition-colors"
                    :class="i <= (itemReviews[item.id]?.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'"
                  />
                </button>
              </div>
            </div>

            <!-- Title (only if has rating) -->
            <template v-if="(itemReviews[item.id]?.rating || 0) > 0">
              <div class="space-y-3">
                <input
                  v-model="itemReviews[item.id].title"
                  type="text"
                  placeholder="Review title (optional)"
                  maxlength="100"
                  class="w-full px-4 py-2.5 text-sm border border-input rounded-xl bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <textarea
                  v-model="itemReviews[item.id].comment"
                  placeholder="Tell us more about your experience (optional)"
                  maxlength="2000"
                  rows="3"
                  class="w-full px-4 py-2.5 text-sm border border-input rounded-xl bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                ></textarea>
              </div>
            </template>
          </div>
        </div>

        <!-- Error -->
        <p v-if="submitError" class="text-sm text-destructive text-center">{{ submitError }}</p>

        <!-- Submit -->
        <button
          @click="submitReviews"
          :disabled="isSubmitting"
          class="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          {{ isSubmitting ? 'Submitting...' : 'Submit Reviews' }}
        </button>
      </div>
    </div>
  </div>
</template>
