<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-vue-next'

definePageMeta({ layout: false })

const route = useRoute()
const token = route.params.token as string

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

const { handleSubmit, isSubmitting, errors, defineField } = useForm({
  validationSchema: toTypedSchema(schema)
})

const [password, passwordAttrs] = defineField('password')
const [confirmPassword, confirmPasswordAttrs] = defineField('confirmPassword')
const showPassword = ref(false)
const showConfirm = ref(false)
const submitted = ref(false)
const error = ref('')

const onSubmit = handleSubmit(async (values) => {
  error.value = ''
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password: values.password },
    })
    submitted.value = true
  } catch (err: any) {
    error.value = err.data?.message || 'Invalid or expired token. Please request a new one.'
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-8">
    <div class="w-full max-w-sm">
      <div class="mb-10 text-center">
        <NuxtLink to="/">
          <NuxtImg src="/img/normal-logo.png" alt="Lindi's Store" class="h-9 w-auto mx-auto mb-8" />
        </NuxtLink>
        <div v-if="submitted">
          <div class="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 class="w-8 h-8 text-emerald-600" />
          </div>
          <h2 class="font-headline font-bold text-on-surface text-2xl mb-2">Password Updated</h2>
          <p class="text-sm text-on-surface-variant font-body mb-6">Your password has been reset successfully.</p>
          <NuxtLink to="/login" class="inline-block px-8 py-3 bg-[#000622] text-white font-label font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity">
            Sign In
          </NuxtLink>
        </div>
        <div v-else>
          <h2 class="font-headline font-bold text-on-surface text-2xl mb-2">New Password</h2>
          <p class="text-sm text-on-surface-variant font-body mb-8">Create a new password for your account.</p>

          <form @submit="onSubmit" class="space-y-6 text-left">
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label block">New Password</label>
              <div class="relative">
                <input v-model="password" v-bind="passwordAttrs" :type="showPassword ? 'text' : 'password'" placeholder="••••••••"
                  class="w-full bg-surface-container-low rounded-sm border-0 py-3 px-4 pr-10 text-sm font-body focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant text-on-surface" />
                <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                  <EyeOff v-if="showPassword" class="w-4 h-4" /><Eye v-else class="w-4 h-4" />
                </button>
              </div>
              <p v-if="errors.password" class="text-xs text-red-600 font-body">{{ errors.password }}</p>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label block">Confirm Password</label>
              <div class="relative">
                <input v-model="confirmPassword" v-bind="confirmPasswordAttrs" :type="showConfirm ? 'text' : 'password'" placeholder="••••••••"
                  class="w-full bg-surface-container-low rounded-sm border-0 py-3 px-4 pr-10 text-sm font-body focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant text-on-surface" />
                <button type="button" @click="showConfirm = !showConfirm" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                  <EyeOff v-if="showConfirm" class="w-4 h-4" /><Eye v-else class="w-4 h-4" />
                </button>
              </div>
              <p v-if="errors.confirmPassword" class="text-xs text-red-600 font-body">{{ errors.confirmPassword }}</p>
            </div>

            <p v-if="error" class="text-xs text-red-600 font-body">{{ error }}</p>

            <button type="submit" :disabled="isSubmitting"
              class="w-full py-4 rounded-md font-label font-bold uppercase tracking-widest text-sm btn-primary flex items-center justify-center gap-3 disabled:opacity-60">
              <div v-if="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {{ isSubmitting ? 'Updating...' : 'Reset Password' }}
            </button>

            <NuxtLink to="/login" class="block text-center text-sm text-secondary hover:text-primary transition-colors font-body">
              <ArrowLeft class="w-4 h-4 inline mr-1" />Back to Login
            </NuxtLink>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
