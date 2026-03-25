<template>
  <div
    class="flex gap-4 items-center justify-center rounded-8 border-white/30 py-8 px-12 shadow-xl text-13 bg-[#282934] bg-linear-to-r from-white/5 to-transparent transition uppercase font-bold"
    :class="[active && 'cursor-pointer border hover:border-white']"
  >
    <slot />
    <div>{{ count }}</div>
  </div>
</template>
<script setup>
defineProps({
  count: { type: Number, default: 0 },
  active: { type: Boolean, default: false },
});
</script>
