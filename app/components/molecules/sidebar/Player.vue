<template>
  <div class="flex items-center justify-between group" v-if="item">
    <div class="flex flex-col">
      <div class="flex items-center gap-8">
        <div
          v-if="isTurn"
          class="w-8 h-8 rounded-full animate-pulse"
          :style="{ backgroundColor: item.color }"
        />

        <div class="flex items-center gap-2">
          <h3
            class="text-20 font-black italic uppercase tracking-tight"
            :style="{ color: getContrastColor(item.color) <= 90 ? '#FFFFFF' : item.color }"
          >
            Игрок {{ item.index }}
          </h3>
          <div class="text-14 font-bold uppercase italic opacity-40 ml-6 self-end mb-2">
            {{ role }}
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-12">
      <!-- Действия -->
      <div v-if="isTurn && isGameStarted" class="flex items-center gap-4 text-slate-500 text-14">
        <div
          v-for="i in +item.actionsPoints - +item.actionsUsed"
          :key="i"
          class="flex items-center gap-6 size-12 rounded-full transition-all shadow-inner bg-cyan-400 shadow-amber-500/50"
        />
        <div>/</div>
        <div>{{ item.actionsPoints }}</div>
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
import { useGameStore } from '~/store/game.js';
import useUtils from '~/composables/useUtils';

const { item } = defineProps({
  item: { type: Object, default: null },
  num: { type: Number },
});

const { activePlayerIndex, isGameStarted } = storeToRefs(useGameStore());
const role = computed(() => (item.type === 'ai' ? 'ИИ' : 'Вы'));
const isTurn = computed(() => +activePlayerIndex.value === +item.index);

const { getContrastColor } = useUtils();
</script>
