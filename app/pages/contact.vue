<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Mail, MapPin, Phone, Send, CheckCircle2 } from 'lucide-vue-next'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

const { handleSubmit, isSubmitting, errors, defineField, resetForm } = useForm({
  validationSchema: toTypedSchema(schema)
})

const [name, nameAttrs] = defineField('name')
const [email, emailAttrs] = defineField('email')
const [subject, subjectAttrs] = defineField('subject')
const [message, messageAttrs] = defineField('message')
const submitted = ref(false)

const onSubmit = handleSubmit(async (values) => {
  try {
    await $fetch('/api/contact', { method: 'POST', body: values })
    submitted.value = true
    resetForm()
  } catch (err: any) {
    // Handled by form
  }
})

useSeoMeta({
  title: "Contact Us | Lindi's Store",
  description: "Get in touch with Lindi's Store for support, inquiries, and feedback."
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <section class="pt-32 pb-16 px-8 max-w-screen-2xl mx-auto border-b border-outline-variant/20">
      <p class="text-secondary font-label font-bold uppercase tracking-widest text-[10px] mb-4">Get in Touch</p>
      <h1 class="font-headline font-medium italic text-5xl tracking-tight text-on-surface mb-6">Contact Us</h1>
      <p class="text-on-surface-variant text-base leading-relaxed font-body max-w-xl">
        Have a question about an order, a product, or just want to say hello? We'd love to hear from you.
      </p>
    </section>

    <div class="px-8 max-w-screen-2xl mx-auto py-16 pb-24">
      <div class="grid lg:grid-cols-2 gap-16">
        <!-- Contact Info -->
        <div class="space-y-12">
          <div>
            <h2 class="font-headline font-bold text-2xl text-on-surface mb-6">How can we help?</h2>
            <p class="text-on-surface-variant font-body leading-relaxed">
              Our team is here to answer your questions about orders, products, shipping, or anything else on your mind. We typically respond within 24 hours.
            </p>
          </div>

          <div class="space-y-6">
            <div class="flex items-start gap-4">
              <div class="p-3 bg-surface-container-low rounded-lg">
                <Mail class="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 class="font-label font-bold text-xs uppercase tracking-widest text-on-surface mb-1">Email</h3>
                <a href="mailto:support@lindisstore.com" class="text-on-surface-variant font-body hover:text-primary transition-colors">support@lindisstore.com</a>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="p-3 bg-surface-container-low rounded-lg">
                <Phone class="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 class="font-label font-bold text-xs uppercase tracking-widest text-on-surface mb-1">Phone</h3>
                <p class="text-on-surface-variant font-body">+233 20 123 4567</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="p-3 bg-surface-container-low rounded-lg">
                <MapPin class="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 class="font-label font-bold text-xs uppercase tracking-widest text-on-surface mb-1">Location</h3>
                <p class="text-on-surface-variant font-body">Accra, Ghana</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Form -->
        <div class="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-8 md:p-10">
          <div v-if="submitted" class="text-center py-12">
            <div class="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 class="w-8 h-8 text-emerald-600" />
            </div>
            <h3 class="font-headline font-bold text-2xl text-on-surface mb-2">Message Sent</h3>
            <p class="text-on-surface-variant font-body mb-6">Thank you for reaching out. We'll get back to you soon.</p>
            <button @click="submitted = false" class="px-6 py-3 bg-[#000622] text-white font-label font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity">
              Send Another
            </button>
          </div>

          <form v-else @submit="onSubmit" class="space-y-6">
            <div class="grid gap-6 md:grid-cols-2">
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label block">Name</label>
                <input v-model="name" v-bind="nameAttrs" type="text" placeholder="Your name"
                  class="w-full bg-surface-container-low rounded-sm border-0 py-3 px-4 text-sm font-body focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant" />
                <p v-if="errors.name" class="text-xs text-red-600 font-body">{{ errors.name }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label block">Email</label>
                <input v-model="email" v-bind="emailAttrs" type="email" placeholder="your@email.com"
                  class="w-full bg-surface-container-low rounded-sm border-0 py-3 px-4 text-sm font-body focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant" />
                <p v-if="errors.email" class="text-xs text-red-600 font-body">{{ errors.email }}</p>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label block">Subject</label>
              <input v-model="subject" v-bind="subjectAttrs" type="text" placeholder="How can we help?"
                class="w-full bg-surface-container-low rounded-sm border-0 py-3 px-4 text-sm font-body focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant" />
              <p v-if="errors.subject" class="text-xs text-red-600 font-body">{{ errors.subject }}</p>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label block">Message</label>
              <textarea v-model="message" v-bind="messageAttrs" rows="5" placeholder="Tell us more..."
                class="w-full bg-surface-container-low rounded-sm border-0 py-3 px-4 text-sm font-body focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant resize-none"></textarea>
              <p v-if="errors.message" class="text-xs text-red-600 font-body">{{ errors.message }}</p>
            </div>
            <button type="submit" :disabled="isSubmitting"
              class="w-full py-4 rounded-md font-label font-bold uppercase tracking-widest text-sm btn-primary flex items-center justify-center gap-3 disabled:opacity-60">
              <Send v-if="!isSubmitting" class="w-4 h-4" />
              <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {{ isSubmitting ? 'Sending...' : 'Send Message' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
