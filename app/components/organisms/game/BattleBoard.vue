<template>
  <div
    class="grid max-h-dvh h-dvh w-dvw grid-cols-[calc(400*var(--spacing))_1fr] overflow-hidden bg-slate-950"
  >
    <Sidebar />
    <Map />
  </div>
</template>

<script setup>
import Map from '~/components/organisms/game/Map.vue';
import Sidebar from '~/components/organisms/game/Sidebar.vue';
</script>
