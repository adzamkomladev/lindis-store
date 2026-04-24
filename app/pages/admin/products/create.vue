<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { productSchema, type ProductInput } from '~~/schemas/product.schema'
import { ArrowLeft, Upload, X, Loader2, ImagePlus, Package, DollarSign, Layers, Sparkles, ListChecks } from 'lucide-vue-next'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

definePageMeta({ layout: 'admin' })

const { handleSubmit, isSubmitting, errors, defineField } = useForm<ProductInput>({
  validationSchema: toTypedSchema(productSchema),
  initialValues: {
    status: 'draft',
    isFeatured: false,
    category: 'other',
    name: '',
    price: 0,
    inventoryCount: 0,
  },
})

const [name, nameAttrs] = defineField('name')
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
const { showError } = useAlertDialog()

const uploadFile = async (file: File) => {
  isUploading.value = true
  const formData = new FormData()
  formData.append('file', file)
  try {
    const result = await $fetch<{ pathname: string }>('/api/images/upload', { method: 'POST', body: formData })
    uploadedImages.value.push(result.pathname)
  } catch { showError('Upload Failed', 'Failed to upload image. Please try again.') }
  finally { isUploading.value = false }
}

const handleFileUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  await uploadFile(input.files[0]); input.value = ''
}

const handleDrop = async (e: DragEvent) => {
  dragActive.value = false
  if (e.dataTransfer?.files?.length) await uploadFile(e.dataTransfer.files[0])
}

const removeImage = (index: number) => uploadedImages.value.splice(index, 1)

const onSubmit = handleSubmit(async (values) => {
  try {
    await $fetch('/api/admin/products', { method: 'POST', body: { ...values, images: uploadedImages.value } })
    navigateTo('/admin/products')
  } catch { showError('Create Failed', 'Failed to create product. Please try again.') }
})
</script>

<template>
  <div class="max-w-4xl mx-auto py-6">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
      <NuxtLink to="/admin/products" class="w-9 h-9 flex items-center justify-center border border-[#c5c6d1] hover:bg-[#edeeef] transition-colors">
        <ArrowLeft class="w-4 h-4 text-[#757681]" />
      </NuxtLink>
      <div>
        <p class="text-[#475d92] font-label font-bold uppercase tracking-[0.2em] text-xs mb-0.5">Catalogue</p>
        <h2 class="font-headline font-black text-[#000622] tracking-tighter uppercase text-2xl">Create Product</h2>
      </div>
    </div>

    <form @submit="onSubmit" class="space-y-5">
      <div class="grid gap-5 lg:grid-cols-3">
        <!-- Main col -->
        <div class="lg:col-span-2 space-y-5">

          <!-- Basic Info -->
          <div class="bg-white border border-[#c5c6d1]/20">
            <div class="flex items-center gap-3 px-6 py-5 border-b border-[#c5c6d1]/15">
              <div class="p-2.5 bg-[#adc3fe]"><Package class="w-4 h-4 text-[#394f83]" /></div>
              <div>
                <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Basic Information</p>
                <p class="text-xs text-[#757681] font-body mt-0.5">Product name and description</p>
              </div>
            </div>
            <div class="p-6 space-y-5">
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Product Name <span class="text-red-500">*</span></label>
                <input v-model="name" v-bind="nameAttrs" placeholder="Enter product name"
                  :class="['w-full border bg-[#f8f9fa] px-4 py-2.5 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors', errors.name ? 'border-red-400' : 'border-[#c5c6d1]']" />
                <p v-if="errors.name" class="text-xs text-red-500 font-body">{{ errors.name }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Description</label>
                <Textarea v-model="description" v-bind="descriptionAttrs" placeholder="Describe your product..."
                  class="min-h-28 border-[#c5c6d1] bg-[#f8f9fa] text-sm font-body focus-visible:ring-[#000622] resize-none" />
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
                  <img :src="`/images/${img}`" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-[#000622]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" @click="removeImage(idx)" class="w-9 h-9 bg-red-500 text-white flex items-center justify-center">
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                  <span v-if="idx === 0" class="absolute top-2 left-2 bg-[#000622] text-[#b1c6ff] text-[10px] font-label font-bold uppercase tracking-widest px-2 py-0.5">Primary</span>
                </div>
              </div>
              <label
                @dragover.prevent="dragActive = true" @dragleave.prevent="dragActive = false" @drop.prevent="handleDrop"
                :class="['flex flex-col items-center justify-center h-40 border-2 border-dashed cursor-pointer transition-all', dragActive ? 'border-[#475d92] bg-[#475d92]/5' : 'border-[#c5c6d1] hover:border-[#000622] hover:bg-[#f8f9fa]']"
              >
                <input type="file" @change="handleFileUpload" accept="image/*" class="hidden" :disabled="isUploading" />
                <Loader2 v-if="isUploading" class="w-7 h-7 text-[#757681] animate-spin mb-2" />
                <Upload v-else class="w-7 h-7 text-[#757681] mb-2" />
                <p class="text-xs font-label font-bold uppercase tracking-widest text-[#757681]">
                  {{ isUploading ? 'Uploading...' : 'Click or drag to upload' }}
                </p>
                <p class="text-[10px] text-[#c5c6d1] font-body mt-1">PNG, JPG up to 10MB</p>
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
            <div class="p-6">
              <div class="grid grid-cols-2 gap-4">
                <div v-for="spec in [
                  { label: 'Material', model: specMaterial, attrs: specMaterialAttrs, placeholder: 'e.g. Stainless Steel' },
                  { label: 'Capacity', model: specCapacity, attrs: specCapacityAttrs, placeholder: 'e.g. 500ml' },
                  { label: 'Dimensions', model: specDimensions, attrs: specDimensionsAttrs, placeholder: 'e.g. 7cm x 25cm' },
                  { label: 'Weight', model: specWeight, attrs: specWeightAttrs, placeholder: 'e.g. 200g' },
                  { label: 'Insulation', model: specInsulation, attrs: specInsulationAttrs, placeholder: 'e.g. Double-wall vacuum' },
                  { label: 'Temp Retention', model: specTempRetention, attrs: specTempRetentionAttrs, placeholder: 'e.g. 24h hot / 36h cold' },
                ]" :key="spec.label" class="space-y-1.5">
                  <label class="text-xs font-body text-[#757681] block">{{ spec.label }}</label>
                  <input v-model="spec.model.value" v-bind="spec.attrs" :placeholder="spec.placeholder"
                    class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-3 py-2 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-5">

          <!-- Pricing -->
          <div class="bg-white border border-[#c5c6d1]/20">
            <div class="flex items-center gap-3 px-5 py-4 border-b border-[#c5c6d1]/15">
              <div class="p-2 bg-emerald-500/10"><DollarSign class="w-4 h-4 text-emerald-600" /></div>
              <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Pricing</p>
            </div>
            <div class="p-5 space-y-2">
              <label class="text-xs font-body text-[#757681] block">Price (GHS) <span class="text-red-500">*</span></label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#757681] font-body text-sm">₵</span>
                <input v-model="price" v-bind="priceAttrs" type="number" step="0.01" min="0" placeholder="0.00"
                  :class="['w-full border bg-[#f8f9fa] pl-8 pr-4 py-2.5 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors', errors.price ? 'border-red-400' : 'border-[#c5c6d1]']" />
              </div>
              <p v-if="errors.price" class="text-xs text-red-500 font-body">{{ errors.price }}</p>
            </div>
          </div>

          <!-- Inventory -->
          <div class="bg-white border border-[#c5c6d1]/20">
            <div class="flex items-center gap-3 px-5 py-4 border-b border-[#c5c6d1]/15">
              <div class="p-2 bg-[#adc3fe]"><Layers class="w-4 h-4 text-[#394f83]" /></div>
              <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Inventory</p>
            </div>
            <div class="p-5 space-y-2">
              <label class="text-xs font-body text-[#757681] block">Stock Quantity <span class="text-red-500">*</span></label>
              <input v-model="inventoryCount" v-bind="inventoryCountAttrs" type="number" min="0" placeholder="0"
                :class="['w-full border bg-[#f8f9fa] px-4 py-2.5 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors', errors.inventoryCount ? 'border-red-400' : 'border-[#c5c6d1]']" />
              <p v-if="errors.inventoryCount" class="text-xs text-red-500 font-body">{{ errors.inventoryCount }}</p>
            </div>
          </div>

          <!-- Status -->
          <div class="bg-white border border-[#c5c6d1]/20">
            <div class="px-5 py-4 border-b border-[#c5c6d1]/15">
              <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Status</p>
            </div>
            <div class="p-5">
              <Select v-model="status">
                <SelectTrigger class="border-[#c5c6d1] h-10 text-xs font-label uppercase tracking-widest"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft"><span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-amber-500 inline-block" />Draft</span></SelectItem>
                  <SelectItem value="active"><span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Active</span></SelectItem>
                  <SelectItem value="archived"><span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-[#c5c6d1] inline-block" />Archived</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Featured -->
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
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-2">
        <NuxtLink to="/admin/products">
          <button type="button" class="px-6 py-3 border border-[#c5c6d1] text-[#000622] font-label font-bold uppercase text-xs tracking-widest hover:bg-[#edeeef] transition-colors">Cancel</button>
        </NuxtLink>
        <button type="submit" :disabled="isSubmitting" class="px-8 py-3 monolith-gradient text-white font-label font-bold uppercase text-xs tracking-widest flex items-center gap-2 disabled:opacity-60">
          <div v-if="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {{ isSubmitting ? 'Creating...' : 'Create Product' }}
        </button>
      </div>
    </form>
  </div>
</template>
