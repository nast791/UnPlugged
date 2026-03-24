<template>
  <div
    class="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none"
  >
    <span
      class="text-14 font-black uppercase tracking-widest border-2 border-white/40 px-3 py-1 rotate-[-5deg]"
    >
      <slot/>
    </span>
  </div>
</template>
<script setup></script>