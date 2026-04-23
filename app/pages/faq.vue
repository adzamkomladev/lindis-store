<script setup lang="ts">
useSeoMeta({
  title: "FAQ | Lindi's Store",
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <section class="pt-32 pb-16 px-8 max-w-screen-2xl mx-auto border-b border-outline-variant/20">
      <p class="text-secondary font-label font-bold uppercase tracking-widest text-[10px] mb-4">Support</p>
      <h1 class="font-headline font-medium italic text-5xl tracking-tight text-on-surface">FAQ</h1>
    </section>
    <div class="px-8 max-w-3xl mx-auto py-16 pb-24 space-y-10">
      <div v-for="(faq, i) in [
        { q: 'How long does delivery take?', a: 'Delivery within Accra takes 1-3 business days. Other regions typically receive orders within 3-7 business days.' },
        { q: 'Do you offer cash on delivery?', a: 'Currently we accept online payments via Paystack, which supports cards, bank transfers, and mobile money.' },
        { q: 'Can I return a product?', a: 'Yes, we accept returns within 14 days of delivery for items in original condition. Contact support to initiate a return.' },
        { q: 'Do I need an account to place an order?', a: 'No, guest checkout is available. However, creating an account lets you track orders and save addresses for faster checkout.' },
        { q: 'How do I track my order?', a: 'Once your order ships, you will receive an email with tracking information. You can also view order status in your account dashboard.' },
        { q: 'Are your products authentic?', a: 'Yes, all products sold on Lindi\'s Store are 100% authentic and sourced directly from trusted manufacturers and distributors.' },
      ]" :key="i">
        <h3 class="font-headline font-bold text-lg text-on-surface mb-2">{{ faq.q }}</h3>
        <p class="text-on-surface-variant font-body leading-relaxed">{{ faq.a }}</p>
      </div>
    </div>
  </div>
</template>
