<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { ArrowLeft, Upload, X, Loader2, ImagePlus, Package, DollarSign, Layers, Save, Sparkles, ListChecks } from 'lucide-vue-next'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const productId = route.params.id as string
const { data: productData, pending } = await useFetch(`/api/admin/products/${productId}`)

const editProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  price: z.number().min(0),
  inventoryCount: z.number().min(0),
  status: z.enum(['draft', 'active', 'archived']),
  isFeatured: z.boolean(),
  specMaterial: z.string().optional(),
  specCapacity: z.string().optional(),
  specDimensions: z.string().optional(),
  specWeight: z.string().optional(),
  specInsulation: z.string().optional(),
  specTempRetention: z.string().optional(),
})

const { handleSubmit, isSubmitting, errors, defineField, setValues } = useForm({ validationSchema: toTypedSchema(editProductSchema) })

const [name, nameAttrs] = defineField('name')
const [slug, slugAttrs] = defineField('slug')
const [description, descriptionAttrs] = defineField('description')
const [price, priceAttrs] = defineField('price')
const [inventoryCount, inventoryCountAttrs] = defineField('inventoryCount')
const [status, statusAttrs] = defineField('status')
const [isFeatured, isFeaturedAttrs] = defineField('isFeatured')
const [specMaterial, specMaterialAttrs] = defineField('specMaterial')
const [specCapacity, specCapacityAttrs] = defineField('specCapacity')
const [specDimensions, specDimensionsAttrs] = defineField('specDimensions')
const [specWeight, specWeightAttrs] = defineField('specWeight')
const [specInsulation, specInsulationAttrs] = defineField('specInsulation')
const [specTempRetention, specTempRetentionAttrs] = defineField('specTempRetention')

const uploadedImages = ref<string[]>([])
const isUploading = ref(false)
const dragActive = ref(false)

const initializeForm = (data: any) => {
  if (data?.product) {
    setValues({
      name: data.product.name, slug: data.product.slug, description: data.product.description || '',
      price: data.product.price / 100, inventoryCount: data.product.inventoryCount, status: data.product.status,
      isFeatured: data.product.isFeatured ?? true,
      specMaterial: data.product.specMaterial || '', specCapacity: data.product.specCapacity || '',
      specDimensions: data.product.specDimensions || '', specWeight: data.product.specWeight || '',
      specInsulation: data.product.specInsulation || '', specTempRetention: data.product.specTempRetention || '',
    })
    uploadedImages.value = data.product.images || []
  }
}

if (productData.value) initializeForm(productData.value)
watch(() => productData.value, initializeForm)

const generateSlug = () => {
  if (name.value) slug.value = name.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const uploadFile = async (file: File) => {
  isUploading.value = true
  const formData = new FormData()
  formData.append('file', file)
  try {
    const result = await $fetch<{ pathname: string }>('/api/images/upload', { method: 'POST', body: formData })
    uploadedImages.value.push(result.pathname)
  } catch { useAlertDialog().showError('Upload Failed', 'Failed to upload image.') }
  finally { isUploading.value = false }
}

const handleFileUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  await uploadFile(input.files[0]); input.value = ''
}
const handleDrop = async (e: DragEvent) => { dragActive.value = false; if (e.dataTransfer?.files?.length) await uploadFile(e.dataTransfer.files[0]) }
const removeImage = (i: number) => uploadedImages.value.splice(i, 1)

const onSubmit = handleSubmit(async (vals) => {
  try {
    await $fetch(`/api/admin/products/${productId}`, { method: 'PUT', body: { ...vals, price: Math.round(vals.price * 100), images: uploadedImages.value } })
    navigateTo(`/admin/products/${productId}`)
  } catch { useAlertDialog().showError('Update Failed', 'Failed to update product.') }
})
</script>

<template>
  <div class="max-w-4xl mx-auto py-6">
    <div class="flex items-center gap-4 mb-8">
      <NuxtLink :to="`/admin/products/${productId}`" class="w-9 h-9 flex items-center justify-center border border-[#c5c6d1] hover:bg-[#edeeef] transition-colors">
        <ArrowLeft class="w-4 h-4 text-[#757681]" />
      </NuxtLink>
      <div>
        <p class="text-[#475d92] font-label font-bold uppercase tracking-[0.2em] text-xs mb-0.5">Catalogue</p>
        <h2 class="font-headline font-black text-[#000622] tracking-tighter uppercase text-2xl">Edit Product</h2>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="bg-white border border-[#c5c6d1]/20 p-6 space-y-4">
      <Skeleton class="h-5 w-32 bg-[#edeeef]" />
      <Skeleton class="h-10 w-full bg-[#edeeef]" />
      <Skeleton class="h-5 w-24 bg-[#edeeef]" />
      <Skeleton class="h-10 w-full bg-[#edeeef]" />
      <Skeleton class="h-28 w-full bg-[#edeeef]" />
    </div>

    <form v-else @submit="onSubmit" class="space-y-5">
      <div class="grid gap-5 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-5">

          <!-- Basic Info -->
          <div class="bg-white border border-[#c5c6d1]/20">
            <div class="flex items-center gap-3 px-6 py-5 border-b border-[#c5c6d1]/15">
              <div class="p-2.5 bg-[#adc3fe]"><Package class="w-4 h-4 text-[#394f83]" /></div>
              <div>
                <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Basic Information</p>
                <p class="text-xs text-[#757681] font-body mt-0.5">Name and description</p>
              </div>
            </div>
            <div class="p-6 space-y-5">
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Product Name <span class="text-red-500">*</span></label>
                <input v-model="name" v-bind="nameAttrs" @blur="generateSlug" placeholder="Enter product name"
                  :class="['w-full border bg-[#f8f9fa] px-4 py-2.5 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors', errors.name ? 'border-red-400' : 'border-[#c5c6d1]']" />
                <p v-if="errors.name" class="text-xs text-red-500">{{ errors.name }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">URL Slug</label>
                <div class="flex gap-2">
                  <input v-model="slug" v-bind="slugAttrs" placeholder="product-url-slug"
                    :class="['flex-1 border bg-[#f8f9fa] px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#000622] transition-colors', errors.slug ? 'border-red-400' : 'border-[#c5c6d1]']" />
                  <button type="button" @click="generateSlug" class="px-4 py-2 border border-[#c5c6d1] text-[#000622] text-xs font-label font-bold uppercase tracking-widest hover:bg-[#edeeef] transition-colors">
                    Generate
                  </button>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Description</label>
                <Textarea v-model="description" v-bind="descriptionAttrs" placeholder="Describe your product in detail..."
                  class="min-h-32 border-[#c5c6d1] bg-[#f8f9fa] text-sm font-body focus-visible:ring-[#000622] resize-none" />
              </div>
            </div>
          </div>

          <!-- Images -->
          <div class="bg-white border border-[#c5c6d1]/20">
            <div class="flex items-center gap-3 px-6 py-5 border-b border-[#c5c6d1]/15">
              <div class="p-2.5 bg-violet-500/10"><ImagePlus class="w-4 h-4 text-violet-600" /></div>
              <div>
                <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Product Images</p>
                <p class="text-xs text-[#757681] font-body mt-0.5">Upload high-quality images</p>
              </div>
            </div>
            <div class="p-6">
              <div v-if="uploadedImages.length" class="grid grid-cols-3 gap-3 mb-4">
                <div v-for="(img, idx) in uploadedImages" :key="idx" class="relative aspect-square border border-[#c5c6d1]/20 overflow-hidden group">
                  <NuxtImg :src="img" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-[#000622]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" @click="removeImage(idx)" class="w-9 h-9 bg-red-500 text-white flex items-center justify-center"><X class="w-4 h-4" /></button>
                  </div>
                  <span v-if="idx === 0" class="absolute top-2 left-2 bg-[#000622] text-[#b1c6ff] text-[10px] font-label font-bold uppercase px-2 py-0.5">Primary</span>
                </div>
              </div>
              <label
                @dragover.prevent="dragActive = true" @dragleave.prevent="dragActive = false" @drop.prevent="handleDrop"
                :class="['flex flex-col items-center justify-center h-40 border-2 border-dashed cursor-pointer transition-all', dragActive ? 'border-[#475d92] bg-[#475d92]/5' : 'border-[#c5c6d1] hover:border-[#000622] hover:bg-[#f8f9fa]']"
              >
                <input type="file" @change="handleFileUpload" accept="image/*" class="hidden" />
                <div v-if="isUploading" class="flex flex-col items-center gap-2">
                  <Loader2 class="w-7 h-7 text-[#757681] animate-spin" />
                  <p class="text-xs font-label font-bold uppercase tracking-widest text-[#757681]">Uploading...</p>
                </div>
                <div v-else class="flex flex-col items-center gap-2">
                  <Upload class="w-7 h-7 text-[#757681]" />
                  <p class="text-xs font-label font-bold uppercase tracking-widest text-[#757681]">Click or drag to upload</p>
                  <p class="text-[10px] text-[#c5c6d1] font-body">PNG, JPG up to 10MB</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Specifications -->
          <div class="bg-white border border-[#c5c6d1]/20">
            <div class="flex items-center gap-3 px-6 py-5 border-b border-[#c5c6d1]/15">
              <div class="p-2.5 bg-amber-500/10"><ListChecks class="w-4 h-4 text-amber-600" /></div>
              <div>
                <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Specifications</p>
                <p class="text-xs text-[#757681] font-body mt-0.5">Technical specs (optional)</p>
              </div>
            </div>
            <div class="p-6 grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-body text-[#757681] block">Material</label>
                <input v-model="specMaterial" v-bind="specMaterialAttrs" placeholder="e.g. Stainless Steel"
                  class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-3 py-2 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-body text-[#757681] block">Capacity</label>
                <input v-model="specCapacity" v-bind="specCapacityAttrs" placeholder="e.g. 500ml"
                  class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-3 py-2 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-body text-[#757681] block">Dimensions</label>
                <input v-model="specDimensions" v-bind="specDimensionsAttrs" placeholder="e.g. 7cm x 25cm"
                  class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-3 py-2 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-body text-[#757681] block">Weight</label>
                <input v-model="specWeight" v-bind="specWeightAttrs" placeholder="e.g. 200g"
                  class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-3 py-2 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-body text-[#757681] block">Insulation</label>
                <input v-model="specInsulation" v-bind="specInsulationAttrs" placeholder="e.g. Double-wall vacuum"
                  class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-3 py-2 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-body text-[#757681] block">Temp Retention</label>
                <input v-model="specTempRetention" v-bind="specTempRetentionAttrs" placeholder="e.g. 24h hot / 36h cold"
                  class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-3 py-2 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-5">
          <div class="bg-white border border-[#c5c6d1]/20">
            <div class="flex items-center gap-3 px-5 py-4 border-b border-[#c5c6d1]/15">
              <div class="p-2 bg-emerald-500/10"><DollarSign class="w-4 h-4 text-emerald-600" /></div>
              <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Pricing</p>
            </div>
            <div class="p-5 space-y-2">
              <label class="text-xs font-body text-[#757681] block">Price (GHS)</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#757681] text-sm">₵</span>
                <input v-model.number="price" v-bind="priceAttrs" type="number" step="0.01" min="0" placeholder="0.00"
                  :class="['w-full border bg-[#f8f9fa] pl-8 pr-4 py-2.5 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors', errors.price ? 'border-red-400' : 'border-[#c5c6d1]']" />
              </div>
              <p v-if="errors.price" class="text-xs text-red-500">{{ errors.price }}</p>
            </div>
          </div>

          <div class="bg-white border border-[#c5c6d1]/20">
            <div class="flex items-center gap-3 px-5 py-4 border-b border-[#c5c6d1]/15">
              <div class="p-2 bg-[#adc3fe]"><Layers class="w-4 h-4 text-[#394f83]" /></div>
              <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Inventory</p>
            </div>
            <div class="p-5 space-y-2">
              <label class="text-xs font-body text-[#757681] block">Stock Quantity</label>
              <input v-model.number="inventoryCount" v-bind="inventoryCountAttrs" type="number" min="0" placeholder="0"
                :class="['w-full border bg-[#f8f9fa] px-4 py-2.5 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors', errors.inventoryCount ? 'border-red-400' : 'border-[#c5c6d1]']" />
              <p v-if="errors.inventoryCount" class="text-xs text-red-500">{{ errors.inventoryCount }}</p>
            </div>
          </div>

          <div class="bg-white border border-[#c5c6d1]/20">
            <div class="px-5 py-4 border-b border-[#c5c6d1]/15">
              <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Status</p>
            </div>
            <div class="p-5">
              <ClientOnly>
                <Select v-model="status">
                  <SelectTrigger class="border-[#c5c6d1] h-10 text-xs font-label uppercase tracking-widest"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <template #fallback><Skeleton class="h-10 w-full bg-[#edeeef]" /></template>
              </ClientOnly>
            </div>
          </div>

          <div class="bg-white border border-[#c5c6d1]/20">
            <div class="flex items-center gap-3 px-5 py-4 border-b border-[#c5c6d1]/15">
              <div class="p-2 bg-violet-500/10"><Sparkles class="w-4 h-4 text-violet-600" /></div>
              <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Featured</p>
            </div>
            <div class="p-5 flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-label font-bold uppercase tracking-wide text-[#000622]">Show in featured</p>
                <p class="text-xs text-[#757681] font-body mt-0.5">Displayed on the homepage</p>
              </div>
              <Switch v-model="isFeatured" v-bind="isFeaturedAttrs" />
            </div>
          </div>

          <div class="space-y-2.5">
            <button type="submit" :disabled="isSubmitting" class="w-full py-3.5 monolith-gradient text-white font-label font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 disabled:opacity-60">
              <div v-if="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <Save v-else class="w-4 h-4" />
              {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
            </button>
            <NuxtLink :to="`/admin/products/${productId}`">
              <button type="button" class="w-full py-3 border border-[#c5c6d1] text-[#000622] font-label font-bold uppercase text-xs tracking-widest hover:bg-[#edeeef] transition-colors">Cancel</button>
            </NuxtLink>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
