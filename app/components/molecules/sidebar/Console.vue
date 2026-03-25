<template>
  <div class="flex flex-col h-300 bg-[#282934]/50 border-t border-slate-700/50 select-none">
    <div class="flex items-center justify-between px-4 py-2 border-b border-slate-700/30 bg-slate-900/40 text-[11px] font-bold uppercase tracking-widest">
      <div class="flex gap-6">
        <div class="flex items-center gap-2">
          <span class="text-slate-500">Ход:</span>
          <span class="text-white bg-slate-700 px-2 py-0.5 rounded-sm">{{ turn }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-slate-500">Время:</span>
          <span class="text-cyan-400 font-mono w-12">{{ timer }}</span>
        </div>
      </div>
      
      <!-- <div class="flex items-center gap-2">
        <div class="w-1.5 h-1.5 rounded-full animate-pulse" :class="isGameStarted ? 'bg-green-500' : 'bg-orange-500'"></div>
        <span class="text-slate-400">{{ isGameStarted ? 'Битва' : 'Расстановка' }}</span>
      </div> -->
    </div>

    <ScrollArea ref="scrollAreaRef" class="flex-1 p-16">
      <div class="flex flex-col gap-4">
        <div v-for="(item, index) in history" :key="item.id" class="group">
          <div
            class="flex gap-8 items-start text-16 leading-snug"
            :class="[index === history?.length - 1 ? 'text-white' : 'text-slate-400']"
          >
            <span>[{{ item.time }}]</span>
            <div>
              {{ item.message }}
            </div>
          </div>

          <div v-if="item?.options?.length" class="mt-3 ml-5 flex flex-wrap gap-2">
            <template v-for="it in item.options" :key="it.text">
              <button
                @click="it.action(it)"
                class="px-12 py-6 text-16 font-bold uppercase tracking-tighter bg-slate-800 border border-slate-700 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 hover:border-cyan-400 active:scale-95 transition-all duration-200 rounded-sm shadow-sm cursor-pointer"
                v-if="!it?.clicked"
              >
                {{ it.text }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>
<script setup>
import ScrollArea from '~/components/atoms/ScrollArea.vue';
import { useGameStore } from '~/store/game.js';

const { history, turn, timer } = storeToRefs(useGameStore());
const scrollAreaRef = ref(null);

watch(
  () => history.value.length,
  async () => {
    await nextTick();
    scrollAreaRef.value?.scrollToBottom();
  },
  { deep: true },
);
</script>
