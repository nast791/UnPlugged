<template>
  <div
    class="w-27 h-27 rounded-6 transition-all shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.3)] ring-1 ring-black/40 border border-white/10 hover:scale-105 active:scale-95 cursor-pointer"
    :style="{
      backgroundColor: color,
      boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), 0 0 15px ${color}66`,
    }"
  />
</template>
<script setup>
defineProps({
  color: String,
});
</script>
