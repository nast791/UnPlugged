<template>
  <button
    class="group flex items-center justify-center w-27 h-27 rounded-6 bg-linear-to-b from-[#3a4255] to-[#1e232d] border border-black/60 ring-1 ring-inset ring-white/10 shadow-md cursor-pointer transition-all hover:from-[#434c62] active:translate-y-0.5 active:shadow-inner"
  >
    <IconPlus
      class="w-14 h-14 text-slate-400 group-hover:text-cyan-400 transition-colors"
      v-if="type === 'plus'"
    />
    <IconMinus
      class="w-14 h-14 text-slate-400 group-hover:text-red-400 transition-colors"
      v-if="type === 'minus'"
    />
  </button>
</template>
<script setup>
import IconPlus from '~/svg/plus.svg';
import IconMinus from '~/svg/minus.svg';

defineProps({
  type: { type: String, default: 'plus' },
});
</script>
