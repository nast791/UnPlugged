<template>
  <div class="flex items-center justify-between group" v-if="item">
    <div class="flex flex-col">
      <div class="flex items-center gap-8">
        <div
          v-if="item.isTurn"
          class="w-8 h-8 rounded-full animate-pulse"
          :style="{ backgroundColor: item.color }"
        />
        <h3
          class="text-20 font-black italic uppercase tracking-tight"
          :style="{ color: item.color }"
        >
          Игрок №{{ num }}
        </h3>
        <div class="text-14 font-bold uppercase italic opacity-40 ml-6 self-end mb-2">
          {{ item.role === 'ai' ? 'ИИ' : 'Вы' }}
        </div>
      </div>
    </div>

    <div class="flex items-center gap-12">
      <!-- Действия -->
      <div
        v-if="item.isTurn"
        class="flex gap-6 px-12 py-6 bg-white/2 rounded-full border border-slate-500"
      >
        <div
          v-for="i in 2"
          :key="i"
          class="w-12 h-12 rounded-full transition-all shadow-inner"
          :class="i <= item.actionsLeft ? 'bg-amber-400 shadow-amber-500/50' : 'bg-slate-600'"
        ></div>
      </div>
      <button class="text-slate-500 hover:text-white transition-colors cursor-pointer">
        <div
          class="w-25 h-25 rounded-full border font-black border-current flex items-center justify-center text-12"
        >
          i
        </div>
      </button>
    </div>
  </div>
</template>
<script setup>
defineProps({
  item: { type: Object, default: null },
  num: { type: Number },
});
</script>
