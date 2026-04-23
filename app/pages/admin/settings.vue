<script setup lang="ts">
import {
  Store, Mail, CreditCard, Shield, Bell, Globe, CheckCircle2, AlertCircle, Key, Save, Megaphone
} from 'lucide-vue-next'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

definePageMeta({ layout: 'admin' })

const { showSuccess, showError } = useAlertDialog()
const { data: currentSettings } = await useFetch('/api/admin/settings')

const storeName = ref("Lindi's Store")
const supportEmail = ref('support@lindisstore.com')
const currency = ref('GHS')
const notifications = ref({ orderConfirmation: true, newOrders: true, lowStock: false })
const bannerText = ref('')

if (currentSettings.value) {
  for (const s of currentSettings.value as any) {
    if (s.key === 'store_name') storeName.value = s.value || ''
    if (s.key === 'support_email') supportEmail.value = s.value || ''
    if (s.key === 'currency') currency.value = s.value || 'GHS'
    if (s.key === 'banner_text') bannerText.value = s.value || ''
    if (s.key === 'notif_order') notifications.value.orderConfirmation = s.value === 'true'
    if (s.key === 'notif_new') notifications.value.newOrders = s.value === 'true'
    if (s.key === 'notif_stock') notifications.value.lowStock = s.value === 'true'
  }
}

const isSaving = ref(false)

const saveSettings = async () => {
  isSaving.value = true
  try {
    const payload = [
      { key: 'store_name', value: storeName.value },
      { key: 'support_email', value: supportEmail.value },
      { key: 'currency', value: currency.value },
      { key: 'banner_text', value: bannerText.value },
      { key: 'notif_order', value: notifications.value.orderConfirmation ? 'true' : 'false' },
      { key: 'notif_new', value: notifications.value.newOrders ? 'true' : 'false' },
      { key: 'notif_stock', value: notifications.value.lowStock ? 'true' : 'false' },
    ]
    await $fetch('/api/admin/settings', { method: 'PUT', body: { settings: payload } })
    showSuccess('Settings Saved', 'Your settings have been saved successfully.')
  } catch (err: any) {
    showError('Error', err.data?.message || 'Failed to save settings')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl space-y-6 py-6">

    <!-- Header -->
    <div>
      <p class="text-[#475d92] font-label font-bold uppercase tracking-[0.2em] text-xs mb-1">Configuration</p>
      <h2 class="font-headline font-black text-[#000622] tracking-tighter uppercase text-2xl">Settings</h2>
    </div>

    <!-- Store Information -->
    <div class="bg-white border border-[#c5c6d1]/20">
      <div class="flex items-center gap-3 px-6 py-5 border-b border-[#c5c6d1]/15">
        <div class="p-2.5 bg-[#adc3fe]">
          <Store class="w-4 h-4 text-[#394f83]" />
        </div>
        <div>
          <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Store Information</p>
          <p class="text-xs text-[#757681] font-body mt-0.5">Basic details about your store</p>
        </div>
      </div>
      <div class="p-6 space-y-5">
        <div class="grid gap-5 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Store Name</label>
            <input v-model="storeName" class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-4 py-2.5 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Support Email</label>
            <input v-model="supportEmail" type="email" class="w-full border border-[#c5c6d1] bg-[#f8f9fa] px-4 py-2.5 text-sm font-body focus:outline-none focus:border-[#000622] transition-colors" />
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Currency</label>
          <Select v-model="currency">
            <SelectTrigger class="w-full md:w-52 h-10 border-[#c5c6d1] text-xs font-label uppercase tracking-widest">
              <Globe class="w-4 h-4 mr-2 text-[#757681]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GHS">Ghana Cedis (GHS)</SelectItem>
              <SelectItem value="USD">US Dollar (USD)</SelectItem>
              <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

    <!-- Payment Integration -->
    <div class="bg-white border border-[#c5c6d1]/20">
      <div class="flex items-center justify-between px-6 py-5 border-b border-[#c5c6d1]/15">
        <div class="flex items-center gap-3">
          <div class="p-2.5 bg-emerald-500/10">
            <CreditCard class="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Payment Integration</p>
            <p class="text-xs text-[#757681] font-body mt-0.5">Configure payment gateways</p>
          </div>
        </div>
        <span class="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 text-[10px] font-label font-bold uppercase tracking-widest flex items-center gap-1.5">
          <CheckCircle2 class="w-3 h-3" />Connected
        </span>
      </div>
      <div class="p-6">
        <div class="flex items-start gap-4 p-4 bg-[#f3f4f5]">
          <div class="w-11 h-11 bg-white border border-[#c5c6d1]/20 flex items-center justify-center shrink-0">
            <span class="text-lg font-black text-[#00C3F7]">P</span>
          </div>
          <div>
            <p class="font-label font-bold text-sm text-[#000622] uppercase tracking-wide">Paystack</p>
            <p class="text-xs text-[#757681] font-body mt-1">Accept cards, bank transfers, and mobile money</p>
            <div class="flex items-center gap-1.5 mt-2 text-[10px] text-[#757681] font-label uppercase tracking-widest">
              <Key class="w-3 h-3" />API Key configured
            </div>
          </div>
        </div>
        <div class="mt-4 p-4 bg-[#000622]/5 border-l-2 border-[#475d92]">
          <p class="text-xs text-[#454650] font-body">
            Environment variable <code class="bg-[#edeeef] px-1.5 py-0.5 text-[10px] font-mono">PAYSTACK_SECRET_KEY</code> is required for payments to work.
          </p>
        </div>
      </div>
    </div>

    <!-- Notifications -->
    <div class="bg-white border border-[#c5c6d1]/20">
      <div class="flex items-center gap-3 px-6 py-5 border-b border-[#c5c6d1]/15">
        <div class="p-2.5 bg-violet-500/10">
          <Bell class="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Notifications</p>
          <p class="text-xs text-[#757681] font-body mt-0.5">Manage email notifications</p>
        </div>
      </div>
      <div class="divide-y divide-[#c5c6d1]/10">
        <div v-for="(item, key) in {
          orderConfirmation: { label: 'Order Confirmations', desc: 'Send confirmation emails to customers' },
          newOrders: { label: 'New Order Alerts', desc: 'Get notified when new orders are placed' },
          lowStock: { label: 'Low Stock Warnings', desc: 'Get alerts when products are running low' }
        }" :key="key" class="flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">{{ item.label }}</p>
            <p class="text-xs text-[#757681] font-body mt-0.5">{{ item.desc }}</p>
          </div>
          <Switch v-model:checked="notifications[key as keyof typeof notifications]" />
        </div>
      </div>
    </div>

    <!-- Announcement Banner -->
    <div class="bg-white border border-[#c5c6d1]/20">
      <div class="flex items-center gap-3 px-6 py-5 border-b border-[#c5c6d1]/15">
        <div class="p-2.5 bg-orange-500/10">
          <Megaphone class="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Announcement Banner</p>
          <p class="text-xs text-[#757681] font-body mt-0.5">Displayed at the top of every page</p>
        </div>
      </div>
      <div class="p-6 space-y-2">
        <label class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Banner Text</label>
        <Textarea
          v-model="bannerText"
          placeholder="e.g. 10% Off your first purchase with the code SUMMER10"
          class="min-h-20 border-[#c5c6d1] bg-[#f8f9fa] text-sm font-body focus-visible:ring-[#000622] resize-none"
        />
        <p class="text-[10px] text-[#757681] font-body">Leave blank to hide the banner entirely.</p>
      </div>
    </div>

    <!-- Security -->
    <div class="bg-white border border-[#c5c6d1]/20">
      <div class="flex items-center gap-3 px-6 py-5 border-b border-[#c5c6d1]/15">
        <div class="p-2.5 bg-amber-500/10">
          <Shield class="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Security</p>
          <p class="text-xs text-[#757681] font-body mt-0.5">Manage your account security</p>
        </div>
      </div>
      <div class="p-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="font-label font-bold text-xs uppercase tracking-widest text-[#000622]">Change Password</p>
            <p class="text-xs text-[#757681] font-body mt-0.5">Update your admin password</p>
          </div>
          <button class="px-4 py-2 border border-[#c5c6d1] text-[#000622] text-xs font-label font-bold uppercase tracking-widest hover:bg-[#edeeef] transition-colors">
            Update
          </button>
        </div>
      </div>
    </div>

    <!-- Save -->
    <div class="flex justify-end">
      <button
        @click="saveSettings"
        :disabled="isSaving"
        class="px-8 py-3.5 text-white font-label font-bold uppercase text-xs tracking-widest flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
        :class="isSaving ? 'bg-[#475d92]' : 'monolith-gradient'"
      >
        <div v-if="isSaving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <Save v-else class="w-4 h-4" />
        {{ isSaving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>
  </div>
</template>
