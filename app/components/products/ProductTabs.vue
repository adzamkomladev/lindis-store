<script setup lang="ts">
import { Package, FileText, Star, ChevronDown } from 'lucide-vue-next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const props = defineProps<{
  productId: number | string
  description?: string
  specMaterial?: string
  specCapacity?: string
  specDimensions?: string
  specWeight?: string
  specInsulation?: string
  specTempRetention?: string
}>()

// Build specs object from individual fields
const specs = computed(() => {
  const entries: Record<string, string> = {}
  if (props.specMaterial) entries['Material'] = props.specMaterial
  if (props.specCapacity) entries['Capacity'] = props.specCapacity
  if (props.specDimensions) entries['Dimensions'] = props.specDimensions
  if (props.specWeight) entries['Weight'] = props.specWeight
  if (props.specInsulation) entries['Insulation'] = props.specInsulation
  if (props.specTempRetention) entries['Temperature Retention'] = props.specTempRetention
  return entries
})
const hasSpecs = computed(() => Object.keys(specs.value).length > 0)

// Reviews
const reviews = ref<any[]>([])
const totalCount = ref(0)
const averageRating = ref(0)
const nextCursor = ref<number | null>(null)
const isLoadingReviews = ref(false)
const reviewsLoaded = ref(false)

const loadReviews = async (reset = false) => {
  if (isLoadingReviews.value) return
  isLoadingReviews.value = true
  try {
    const params: Record<string, any> = { limit: 5 }
    if (!reset && nextCursor.value) params.cursor = nextCursor.value

    const data = await $fetch<any>(`/api/reviews/${props.productId}`, { query: params })

    if (reset) {
      reviews.value = data.reviews
    } else {
      reviews.value = [...reviews.value, ...data.reviews]
    }
    totalCount.value = data.totalCount
    averageRating.value = data.averageRating
    nextCursor.value = data.nextCursor
    reviewsLoaded.value = true
  } catch (e) {
    console.error('Failed to load reviews', e)
  } finally {
    isLoadingReviews.value = false
  }
}

const onReviewTabActivated = () => {
  if (!reviewsLoaded.value) loadReviews(true)
}

const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat('en-GH', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date))
</script>

<template>
  <div class="mt-8 md:mt-12">
    <Tabs default-value="description" class="w-full">
      <TabsList class="w-full grid grid-cols-3 h-auto p-1 bg-muted/50 rounded-2xl border border-border/50">
        <TabsTrigger 
          value="description" 
          class="flex items-center gap-2 py-3 text-sm md:text-base data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-xl transition-all"
        >
          <FileText class="w-4 h-4 text-primary" />
          <span class="hidden sm:inline">Description</span>
          <span class="sm:hidden">Info</span>
        </TabsTrigger>
        <TabsTrigger 
          value="specifications"
          class="flex items-center gap-2 py-3 text-sm md:text-base data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-xl transition-all"
        >
          <Package class="w-4 h-4 text-primary" />
          <span class="hidden sm:inline">Specifications</span>
          <span class="sm:hidden">Specs</span>
        </TabsTrigger>
        <TabsTrigger 
          value="reviews"
          class="flex items-center gap-2 py-3 text-sm md:text-base data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-xl transition-all"
          @click="onReviewTabActivated"
        >
          <Star class="w-4 h-4 text-primary" />
          Reviews
          <span v-if="totalCount > 0" class="ml-1 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-medium">{{ totalCount }}</span>
        </TabsTrigger>
      </TabsList>
      
      <!-- Description Tab -->
      <TabsContent value="description" class="mt-8">
        <div class="prose max-w-none">
          <p class="text-muted-foreground leading-relaxed text-base md:text-lg">
            {{ description || 'Premium quality product designed for your active lifestyle. Made with sustainable materials and built to last.' }}
          </p>
          <div class="mt-8 space-y-4">
            <div class="flex items-start gap-4 p-5 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
              <div class="p-3 rounded-xl bg-background border border-border shadow-sm">
                <svg class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 class="font-serif text-lg font-bold text-foreground mb-1">Eco-Friendly Materials</h4>
                <p class="text-muted-foreground text-sm">Made from sustainable, BPA-free materials that are safe for you and the environment.</p>
              </div>
            </div>
            
            <div class="flex items-start gap-4 p-5 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
              <div class="p-3 rounded-xl bg-background border border-border shadow-sm">
                <svg class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div>
                <h4 class="font-serif text-lg font-bold text-foreground mb-1">Handcrafted Quality</h4>
                <p class="text-muted-foreground text-sm">Each piece is carefully crafted by skilled artisans.</p>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
      
      <!-- Specifications Tab -->
      <TabsContent value="specifications" class="mt-8">
        <div v-if="hasSpecs" class="grid gap-3 md:gap-4">
          <div 
            v-for="(value, key) in specs" 
            :key="key"
            class="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <span class="text-sm font-medium text-muted-foreground">{{ key }}</span>
            <span class="text-sm font-semibold text-foreground">{{ value }}</span>
          </div>
        </div>
        <div v-else class="text-center py-16 px-4 bg-muted/30 border border-border/50 rounded-2xl border-dashed">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background border border-border shadow-sm mb-4">
            <Package class="w-6 h-6 text-primary" />
          </div>
          <h3 class="font-serif text-2xl font-bold text-foreground mb-2">No specifications</h3>
          <p class="text-muted-foreground text-sm">Specifications haven't been added for this product yet.</p>
        </div>
      </TabsContent>
      
      <!-- Reviews Tab -->
      <TabsContent value="reviews" class="mt-8">
        <!-- Loading -->
        <div v-if="isLoadingReviews && !reviewsLoaded" class="space-y-4">
          <div v-for="i in 3" :key="i" class="p-4 rounded-xl bg-muted/30 border border-border/50 animate-pulse">
            <div class="h-4 w-32 bg-muted rounded mb-2"></div>
            <div class="h-3 w-24 bg-muted rounded mb-3"></div>
            <div class="h-3 w-full bg-muted rounded mb-1"></div>
            <div class="h-3 w-3/4 bg-muted rounded"></div>
          </div>
        </div>

        <!-- Review Summary -->
        <div v-else-if="reviews.length > 0">
          <div class="flex items-center gap-4 p-5 rounded-2xl bg-muted/30 border border-border/50 mb-6">
            <div class="text-center">
              <p class="text-4xl font-bold text-foreground">{{ averageRating.toFixed(1) }}</p>
              <div class="flex items-center gap-0.5 mt-1 justify-center">
                <Star
                  v-for="i in 5"
                  :key="i"
                  class="w-4 h-4"
                  :class="i <= Math.round(averageRating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'"
                />
              </div>
              <p class="text-xs text-muted-foreground mt-1">{{ totalCount }} review{{ totalCount !== 1 ? 's' : '' }}</p>
            </div>
          </div>

          <!-- Review List -->
          <div class="space-y-4">
            <div
              v-for="review in reviews"
              :key="review.id"
              class="p-4 md:p-5 rounded-xl bg-muted/30 border border-border/50"
            >
              <div class="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p class="font-semibold text-sm text-foreground">{{ review.customerName || 'Customer' }}</p>
                  <div class="flex items-center gap-0.5 mt-0.5">
                    <Star
                      v-for="i in 5"
                      :key="i"
                      class="w-3.5 h-3.5"
                      :class="i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'"
                    />
                  </div>
                </div>
                <span class="text-xs text-muted-foreground shrink-0">{{ formatDate(review.createdAt) }}</span>
              </div>
              <p v-if="review.title" class="font-medium text-sm text-foreground mb-1">{{ review.title }}</p>
              <p v-if="review.comment" class="text-sm text-muted-foreground leading-relaxed">{{ review.comment }}</p>
            </div>
          </div>

          <!-- Load More -->
          <div v-if="nextCursor" class="mt-6 text-center">
            <button
              @click="loadReviews(false)"
              :disabled="isLoadingReviews"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              <ChevronDown v-if="!isLoadingReviews" class="w-4 h-4" />
              <div v-else class="w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin"></div>
              {{ isLoadingReviews ? 'Loading...' : 'Load more reviews' }}
            </button>
          </div>
        </div>

        <!-- Empty -->
        <div v-else class="text-center py-16 px-4 bg-muted/30 border border-border/50 rounded-2xl border-dashed">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background border border-border shadow-sm mb-4">
            <Star class="w-6 h-6 text-primary" />
          </div>
          <h3 class="font-serif text-2xl font-bold text-foreground mb-2">No reviews yet</h3>
          <p class="text-muted-foreground text-sm">Be the first to purchase and review this product!</p>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
