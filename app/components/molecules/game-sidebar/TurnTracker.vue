<template>
  <div class="grid grid-cols-2 gap-px bg-white/5 border-b border-white/10 shrink-0">
    <div
      class="p-12 text-center border-r border-white/10 bg-gradient-to-b from-white/5 to-transparent"
    >
      <p class="text-14 font-black uppercase text-slate-500">Ход</p>
      <p class="text-26 font-mono font-bold">#{{ round }}</p>
    </div>
    <div class="p-12 text-center bg-gradient-to-b from-white/5 to-transparent">
      <p class="text-14 font-black uppercase text-slate-500">Время</p>
      <p class="text-26 font-mono font-bold">{{ timer }}</p>
    </div>
  </div>
</template>
<script setup>
import { useGameStore } from '~/store/game.js';

const { round, timer } = storeToRefs(useGameStore());
</script>
