<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-vue-next'

definePageMeta({ layout: false })

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const { handleSubmit, isSubmitting, errors, defineField } = useForm({
  validationSchema: toTypedSchema(schema)
})

const [email, emailAttrs] = defineField('email')
const submitted = ref(false)
const error = ref('')

const onSubmit = handleSubmit(async (values) => {
  error.value = ''
  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: values,
    })
    submitted.value = true
  } catch (err: any) {
    error.value = err.data?.message || 'Something went wrong. Please try again.'
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
          <h2 class="font-headline font-bold text-on-surface text-2xl mb-2">Check your email</h2>
          <p class="text-sm text-on-surface-variant font-body">If an account exists with that email, we've sent password reset instructions.</p>
          <NuxtLink to="/login" class="inline-block mt-6 text-sm font-bold text-secondary hover:text-primary transition-colors font-body">
            <ArrowLeft class="w-4 h-4 inline mr-1" />Back to Login
          </NuxtLink>
        </div>
        <div v-else>
          <h2 class="font-headline font-bold text-on-surface text-2xl mb-2">Reset Password</h2>
          <p class="text-sm text-on-surface-variant font-body mb-8">Enter your email and we'll send you a link to reset your password.</p>

          <form @submit="onSubmit" class="space-y-6 text-left">
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label block">Email Address</label>
              <input v-model="email" v-bind="emailAttrs" type="email" placeholder="henry@culinaryheritage.com"
                class="w-full bg-surface-container-low rounded-sm border-0 py-3 px-4 text-sm font-body focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant" />
              <p v-if="errors.email" class="text-xs text-red-600 font-body">{{ errors.email }}</p>
            </div>
            <p v-if="error" class="text-xs text-red-600 font-body">{{ error }}</p>
            <button type="submit" :disabled="isSubmitting"
              class="w-full py-4 rounded-md font-label font-bold uppercase tracking-widest text-sm btn-primary flex items-center justify-center gap-3 disabled:opacity-60">
              <Mail v-if="!isSubmitting" class="w-4 h-4" />
              <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {{ isSubmitting ? 'Sending...' : 'Send Reset Link' }}
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
