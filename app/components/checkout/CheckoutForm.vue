<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { checkoutSchema } from '~~/schemas/order.schema'
import { User, Mail, Phone, MapPin, Building } from 'lucide-vue-next'

const emit = defineEmits<{
  submit: [values: any]
}>()

const props = defineProps<{
  isSubmitting: boolean
}>()

const { handleSubmit, errors, defineField } = useForm({
  validationSchema: toTypedSchema(checkoutSchema)
})

const [name, nameAttrs] = defineField('name')
const [email, emailAttrs] = defineField('email')
const [phone, phoneAttrs] = defineField('phone')
const [address, addressAttrs] = defineField('address')
const [city, cityAttrs] = defineField('city')

const onSubmit = handleSubmit((values) => {
  emit('submit', values)
})
</script>

<template>
  <form @submit="onSubmit" class="space-y-10">

    <!-- Section: Contact Information -->
    <section class="space-y-6">
      <div>
        <span class="font-label font-bold uppercase tracking-[0.2em] text-[#475d92] text-xs block mb-2">Step 01</span>
        <h3 class="font-headline font-bold text-[#000622] text-xl uppercase tracking-tight">Contact Information</h3>
      </div>

      <div class="grid sm:grid-cols-2 gap-6">
        <!-- Full Name -->
        <div class="space-y-2">
          <label for="name" class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Full Name</label>
          <input
            id="name"
            v-model="name"
            v-bind="nameAttrs"
            type="text"
            placeholder="John Doe"
            class="w-full bg-transparent border-0 border-b py-3 px-0 text-sm font-body focus:outline-none transition-colors placeholder:text-[#c5c6d1]"
            :class="errors.name ? 'border-red-400 focus:border-red-600' : 'border-[#c5c6d1] focus:border-[#000622]'"
          />
          <p v-if="errors.name" class="text-xs text-red-600 font-body">{{ errors.name }}</p>
        </div>

        <!-- Email -->
        <div class="space-y-2">
          <label for="email" class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Email Address</label>
          <input
            id="email"
            v-model="email"
            v-bind="emailAttrs"
            type="email"
            placeholder="john@example.com"
            class="w-full bg-transparent border-0 border-b py-3 px-0 text-sm font-body focus:outline-none transition-colors placeholder:text-[#c5c6d1]"
            :class="errors.email ? 'border-red-400 focus:border-red-600' : 'border-[#c5c6d1] focus:border-[#000622]'"
          />
          <p v-if="errors.email" class="text-xs text-red-600 font-body">{{ errors.email }}</p>
          <p v-else class="text-xs text-[#757681] font-body">Order confirmation sent here</p>
        </div>
      </div>

      <!-- Phone -->
      <div class="space-y-2">
        <label for="phone" class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Phone Number</label>
        <input
          id="phone"
          v-model="phone"
          v-bind="phoneAttrs"
          type="tel"
          placeholder="0244 123 456"
          class="w-full bg-transparent border-0 border-b py-3 px-0 text-sm font-body focus:outline-none transition-colors placeholder:text-[#c5c6d1]"
          :class="errors.phone ? 'border-red-400 focus:border-red-600' : 'border-[#c5c6d1] focus:border-[#000622]'"
        />
        <p v-if="errors.phone" class="text-xs text-red-600 font-body">{{ errors.phone }}</p>
        <p v-else class="text-xs text-[#757681] font-body">For delivery updates via SMS</p>
      </div>
    </section>

    <!-- Divider -->
    <div class="border-t border-[#c5c6d1]/20"></div>

    <!-- Section: Shipping Address -->
    <section class="space-y-6">
      <div>
        <span class="font-label font-bold uppercase tracking-[0.2em] text-[#475d92] text-xs block mb-2">Step 02</span>
        <h3 class="font-headline font-bold text-[#000622] text-xl uppercase tracking-tight">Shipping Address</h3>
      </div>

      <!-- Street Address -->
      <div class="space-y-2">
        <label for="address" class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">Street Address</label>
        <input
          id="address"
          v-model="address"
          v-bind="addressAttrs"
          type="text"
          placeholder="123 Main Street, Apartment 4B"
          class="w-full bg-transparent border-0 border-b py-3 px-0 text-sm font-body focus:outline-none transition-colors placeholder:text-[#c5c6d1]"
          :class="errors.address ? 'border-red-400 focus:border-red-600' : 'border-[#c5c6d1] focus:border-[#000622]'"
        />
        <p v-if="errors.address" class="text-xs text-red-600 font-body">{{ errors.address }}</p>
      </div>

      <!-- City -->
      <div class="space-y-2">
        <label for="city" class="text-xs font-bold uppercase tracking-widest text-[#757681] font-label block">City</label>
        <input
          id="city"
          v-model="city"
          v-bind="cityAttrs"
          type="text"
          placeholder="Accra"
          class="w-full bg-transparent border-0 border-b py-3 px-0 text-sm font-body focus:outline-none transition-colors placeholder:text-[#c5c6d1]"
          :class="errors.city ? 'border-red-400 focus:border-red-600' : 'border-[#c5c6d1] focus:border-[#000622]'"
        />
        <p v-if="errors.city" class="text-xs text-red-600 font-body">{{ errors.city }}</p>
      </div>
    </section>

    <slot :is-submitting="isSubmitting" />
  </form>
</template>
