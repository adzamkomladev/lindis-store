<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { loginSchema } from '~~/schemas/auth.schema'
import { LogIn, Eye, EyeOff } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const { login } = useAuth()
const { handleSubmit, isSubmitting, errors, defineField } = useForm({
  validationSchema: toTypedSchema(loginSchema)
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')
const loginError = ref('')
const showPassword = ref(false)

const onSubmit = handleSubmit(async (values) => {
  loginError.value = ''
  try {
    await login(values)
    navigateTo('/account')
  } catch (error: any) {
    loginError.value = error?.data?.message || 'Invalid credentials. Please try again.'
  }
})
</script>

<template>
  <div class="min-h-screen flex bg-background">
    <!-- Left Panel: Editorial Brand Image -->
    <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-end p-12">
      <NuxtImg src="/login_hero.png" alt="Lindi's Store Kitchen" class="absolute inset-0 w-full h-full object-cover" />
      <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
      <div class="relative z-10 max-w-md">
        <blockquote class="font-headline font-medium text-white text-3xl leading-snug mb-6 opacity-90 italic">
          "The kitchen is the soul of the home, where heritage is tasted and memories are seasoned."
        </blockquote>
        <div class="flex items-center gap-4">
          <span class="text-white/70 font-label text-xs uppercase tracking-[0.2em]">Lindi's Store - The Culinary Editorial</span>
        </div>
      </div>
    </div>

    <!-- Right Panel: Login Form -->
    <div class="flex-1 flex flex-col justify-between p-8 lg:p-16">
      <div class="hidden lg:block"></div>
      <div class="w-full max-w-sm mx-auto">
        <div class="lg:hidden mb-10 text-center">
          <NuxtImg src="/img/normal-logo.png" alt="Lindi's Store" class="h-9 w-auto mx-auto mb-1" />
        </div>
        <div class="mb-10">
          <h2 class="font-headline font-bold text-on-surface text-4xl mb-2">Welcome Back</h2>
          <p class="text-on-surface-variant font-body text-sm">Sign in to your account to continue your culinary journey.</p>
        </div>

        <div v-if="loginError" class="mb-6 p-4 rounded-sm bg-red-50 text-red-700 text-sm font-body">
          {{ loginError }}
        </div>

        <form @submit="onSubmit" class="space-y-6">
          <div class="space-y-2">
            <label for="email" class="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label block">Email Address</label>
            <input
              id="email"
              v-model="email"
              v-bind="emailAttrs"
              type="email"
              autocomplete="email"
              placeholder="henry@culinaryheritage.com"
              class="w-full bg-surface-container-low rounded-sm border-0 py-3 px-4 text-sm font-body focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
            />
            <p v-if="errors.email" class="text-xs text-red-600 font-body">{{ errors.email }}</p>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <label for="password" class="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label block">Password</label>
              <NuxtLink to="/forgot-password" class="text-xs text-secondary hover:text-primary transition-colors font-body">Forgot Password?</NuxtLink>
            </div>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                v-bind="passwordAttrs"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full bg-surface-container-low rounded-sm border-0 py-3 px-4 pr-10 text-sm font-body focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant text-on-surface"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
            <p v-if="errors.password" class="text-xs text-red-600 font-body">{{ errors.password }}</p>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full py-4 rounded-md font-label font-bold uppercase tracking-widest text-sm btn-primary flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <div v-if="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {{ isSubmitting ? 'Signing In...' : 'Sign In' }}
          </button>

          <div class="text-center pt-4">
            <p class="text-sm font-body text-on-surface-variant">New to Lindi's Store? <NuxtLink to="/register" class="text-secondary hover:text-primary transition-colors font-bold">Create Account</NuxtLink></p>
          </div>
        </form>
      </div>

      <div class="flex justify-between items-center text-[10px] text-on-surface-variant/60 font-label uppercase tracking-widest mt-16 pt-6 border-t border-outline-variant/30">
        <p>© {{ new Date().getFullYear() }} Lindi's Store</p>
      </div>
    </div>
  </div>
</template>
