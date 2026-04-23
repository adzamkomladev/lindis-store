<script setup lang="ts">
import { ref } from 'vue'
import { CheckCircle2, Loader2 } from 'lucide-vue-next'

const email = ref('')
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const errorMsg = ref('')

const subscribe = async () => {
  if (!email.value.trim()) return
  status.value = 'loading'
  errorMsg.value = ''
  try {
    await $fetch('/api/newsletter/subscribe', {
      method: 'POST',
      body: { email: email.value.trim() },
    })
    status.value = 'success'
    email.value = ''
  } catch (err: any) {
    status.value = 'error'
    errorMsg.value = err.data?.message || 'Something went wrong'
  }
}
</script>

<template>
  <div>
    <div class="relative">
      <input
        v-model="email"
        type="email"
        placeholder="Email Address"
        class="w-full bg-transparent border-0 border-b border-outline-variant py-2 pr-10 focus:outline-none focus:border-[#000622] transition-colors text-sm font-label placeholder:text-outline"
        @keyup.enter="subscribe"
        :disabled="status === 'loading'"
      />
      <button
        @click="subscribe"
        class="absolute right-0 top-1/2 -translate-y-1/2 text-[#000622] hover:opacity-70 transition-opacity"
        aria-label="Subscribe"
        :disabled="status === 'loading'"
      >
        <Loader2 v-if="status === 'loading'" class="w-5 h-5 animate-spin" />
        <CheckCircle2 v-else-if="status === 'success'" class="w-5 h-5 text-emerald-600" />
        <span v-else class="material-symbols-outlined text-lg">north_east</span>
      </button>
    </div>
    <p v-if="status === 'success'" class="text-xs text-emerald-600 font-body mt-2">Thanks for subscribing!</p>
    <p v-else-if="status === 'error'" class="text-xs text-red-600 font-body mt-2">{{ errorMsg }}</p>
  </div>
</template>
