<script setup lang="ts">
import AdminSidebar from '~/components/admin/AdminSidebar.vue'
import AdminHeader from '~/components/admin/AdminHeader.vue'
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fa]">
    <!-- Sidebar: Fixed on desktop -->
    <AdminSidebar />

    <!-- Main Content Area -->
    <div class="md:pl-64 min-h-screen flex flex-col">
      <AdminHeader />
      <main class="flex-1 px-6 md:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>
