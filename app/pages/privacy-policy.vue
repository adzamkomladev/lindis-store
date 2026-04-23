<script setup lang="ts">
useSeoMeta({
  title: "Privacy Policy | Lindi's Store",
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <section class="pt-32 pb-16 px-8 max-w-screen-2xl mx-auto border-b border-outline-variant/20">
      <p class="text-secondary font-label font-bold uppercase tracking-widest text-[10px] mb-4">Legal</p>
      <h1 class="font-headline font-medium italic text-5xl tracking-tight text-on-surface">Privacy Policy</h1>
    </section>
    <div class="px-8 max-w-3xl mx-auto py-16 pb-24 space-y-10">
      <p class="text-on-surface-variant font-body leading-relaxed">Last updated: {{ new Date().getFullYear() }}</p>
      <div>
        <h2 class="font-headline font-bold text-xl text-on-surface mb-3">Information We Collect</h2>
        <p class="text-on-surface-variant font-body leading-relaxed">
          We collect information you provide directly to us, including your name, email address, phone number, shipping address, and payment information. We also collect data about your browsing behavior and purchase history.
        </p>
      </div>
      <div>
        <h2 class="font-headline font-bold text-xl text-on-surface mb-3">How We Use Your Information</h2>
        <p class="text-on-surface-variant font-body leading-relaxed">
          We use your information to process orders, communicate with you, improve our services, and send promotional emails (which you can opt out of at any time).
        </p>
      </div>
      <div>
        <h2 class="font-headline font-bold text-xl text-on-surface mb-3">Data Security</h2>
        <p class="text-on-surface-variant font-body leading-relaxed">
          We implement industry-standard security measures to protect your personal information. Payment processing is handled securely by Paystack and we do not store your card details.
        </p>
      </div>
      <div>
        <h2 class="font-headline font-bold text-xl text-on-surface mb-3">Contact Us</h2>
        <p class="text-on-surface-variant font-body leading-relaxed">
          If you have any questions about this Privacy Policy, please contact us at support@lindisstore.com.
        </p>
      </div>
    </div>
  </div>
</template>
