<template>
  <div class="flex flex-col h-300 bg-[#282934]/50 border-t border-slate-700/50 select-none">
    <div
      class="flex items-center justify-between px-16 py-8 border-b border-slate-700/30 bg-slate-900/40 text-14 font-bold uppercase tracking-wide"
      v-if="turn"
    >
      <div class="flex items-center gap-4">
        <span class="text-slate-500">Ход:</span>
        <span class="text-white">{{ turn }}</span>
      </div>
      <div class="flex items-center text-cyan-400">
        {{ formattedTime }}
      </div>
    </div>

    <ScrollArea ref="scrollAreaRef" class="flex-1 px-16">
      <div class="flex flex-col gap-4 py-16">
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
import usePlacementManager from '~/composables/game/usePlacementManager';

const { history, turn } = storeToRefs(useGameStore());
const { formattedTime } = usePlacementManager();
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
