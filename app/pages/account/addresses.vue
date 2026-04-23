<script setup lang="ts">
import { MapPin, Plus, Trash2, X, Check } from 'lucide-vue-next'

definePageMeta({ layout: 'account' })

const { showSuccess, showError } = useAlertDialog()
const { data: addresses, refresh } = await useFetch('/api/account/addresses')

const isAdding = ref(false)
const isSubmitting = ref(false)
const newAddress = ref({ name: '', phone: '', address: '', city: '', isDefault: false })

const addAddress = async () => {
  if (!newAddress.value.name || !newAddress.value.phone || !newAddress.value.address || !newAddress.value.city) return
  isSubmitting.value = true
  try {
    await $fetch('/api/account/addresses', {
      method: 'POST',
      body: newAddress.value,
    })
    showSuccess('Address Added', 'Your shipping address has been saved.')
    newAddress.value = { name: '', phone: '', address: '', city: '', isDefault: false }
    isAdding.value = false
    await refresh()
  } catch (err: any) {
    showError('Error', err.data?.message || 'Failed to add address')
  } finally {
    isSubmitting.value = false
  }
}

const deleteAddress = async (id: string) => {
  try {
    await $fetch(`/api/account/addresses/${id}`, { method: 'DELETE' })
    showSuccess('Address Removed', 'The address has been deleted.')
    await refresh()
  } catch (err: any) {
    showError('Error', err.data?.message || 'Failed to delete address')
  }
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-headline font-black text-[#000622] text-3xl mb-2">Addresses</h1>
        <p class="text-sm text-[#757681] font-body">Manage your saved shipping addresses.</p>
      </div>
      <button
        v-if="!isAdding"
        @click="isAdding = true"
        class="px-4 py-2.5 bg-[#000622] text-white font-label font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <Plus class="w-3.5 h-3.5" />
        Add Address
      </button>
    </div>

    <!-- Add Address Form -->
    <div v-if="isAdding" class="bg-white border border-[#c5c6d1]/20 p-6">
      <div class="flex items-center justify-between mb-6">
        <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">New Address</p>
        <button @click="isAdding = false" class="text-[#757681] hover:text-[#000622]"><X class="w-4 h-4" /></button>
      </div>
      <div class="grid gap-5 md:grid-cols-2">
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Full Name</label>
          <input v-model="newAddress.name" class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-4 py-2.5 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
        </div>
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Phone</label>
          <input v-model="newAddress.phone" class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-4 py-2.5 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
        </div>
        <div class="space-y-2 md:col-span-2">
          <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Address</label>
          <input v-model="newAddress.address" class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-4 py-2.5 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
        </div>
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">City</label>
          <input v-model="newAddress.city" class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-4 py-2.5 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
        </div>
        <div class="flex items-end">
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="newAddress.isDefault" type="checkbox" class="w-4 h-4 accent-[#000622]" />
            <span class="text-sm font-body text-[#000622]">Set as default</span>
          </label>
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-6">
        <button @click="isAdding = false" class="px-5 py-2.5 border border-[#c5c6d1] text-[#000622] text-xs font-label font-bold uppercase tracking-widest hover:bg-[#edeeef] transition-colors">Cancel</button>
        <button @click="addAddress" :disabled="isSubmitting" class="px-5 py-2.5 bg-[#000622] text-white text-xs font-label font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50">
          {{ isSubmitting ? 'Saving...' : 'Save Address' }}
        </button>
      </div>
    </div>

    <!-- Address List -->
    <div v-if="addresses?.length" class="grid gap-4">
      <div
        v-for="addr in addresses"
        :key="addr.id"
        class="bg-white border border-[#c5c6d1]/20 p-6 relative"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-3">
            <div class="p-2 bg-violet-500/10 rounded"><MapPin class="w-4 h-4 text-violet-600" /></div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <p class="font-body font-bold text-sm text-[#000622]">{{ addr.name }}</p>
                <span v-if="addr.isDefault" class="text-[9px] font-bold uppercase tracking-widest font-label px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">Default</span>
              </div>
              <p class="text-sm text-[#757681] font-body">{{ addr.address }}</p>
              <p class="text-sm text-[#757681] font-body">{{ addr.city }}</p>
              <p class="text-sm text-[#757681] font-body mt-1">{{ addr.phone }}</p>
            </div>
          </div>
          <button @click="deleteAddress(addr.id)" class="text-[#757681] hover:text-red-600 transition-colors p-2">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div v-else class="bg-white border border-[#c5c6d1]/20 p-12 text-center">
      <MapPin class="w-10 h-10 text-[#c5c6d1] mx-auto mb-4" />
      <h3 class="font-headline font-bold text-xl text-[#000622] mb-2">No saved addresses</h3>
      <p class="text-sm text-[#757681] font-body mb-6">Add a shipping address for faster checkout.</p>
      <button @click="isAdding = true" class="inline-block px-6 py-3 bg-[#000622] text-white font-label font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity">
        Add Address
      </button>
    </div>
  </div>
</template>
