<template>
  <div class="flex flex-col h-300 bg-[#282934]/50 border-t border-slate-700/50 select-none">
    <div
      class="flex items-center justify-between px-16 py-8 border-b border-slate-700/30 bg-slate-900/40 text-14 font-bold uppercase tracking-wide"
      v-if="turnCount"
    >
      <div class="flex items-center gap-4">
        <span class="text-slate-500">Ход:</span>
        <span class="text-white">{{ turnCount }}</span>
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
              {{ item.msg }}
            </div>
          </div>
        </div>

        <div
          v-if="showActions"
          class="mt-3 flex flex-wrap gap-6"
        >
          <template v-for="it in actions" :key="it.text">
            <button
              :disabled="it.disabled"
              @click="clickHandler(it)"
              class="px-12 py-6 text-16 font-bold uppercase tracking-tighter bg-slate-500/30 border border-slate-700 text-cyan-500 hover:bg-fuchsia-400 hover:text-slate-950 hover:border-fuchsia-500 active:scale-95 transition-all duration-200 rounded-sm shadow-sm cursor-pointer"
            >
              {{ it.text }}
            </button>
          </template>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>
<script setup>
import ScrollArea from '~/components/atoms/ScrollArea.vue';
import { useBoardgame } from '~/composables/game/useBoardgame';
import {useTurnStart} from '~/composables/phases/useTurnStart';

const { client, G, ctx } = useBoardgame();
const turnCount = computed(() => ctx.value?.turn || 0);
const history = computed(() => G.value?.log || []);
const actions = computed(() => G.value?.pendingActions || []);

const { formattedTime } = useTurnStart();
const scrollAreaRef = ref(null);

const isMyTurn = computed(() => {
  return ctx.value?.currentPlayer === client.value?.playerID;
});

const isHuman = computed(() => {
  const activeId = ctx.value?.currentPlayer;
  return G.value?.players[activeId]?.type === 'human';
});

const showActions = computed(() => isMyTurn.value && isHuman.value && G.value?.pendingActions?.length > 0);

const clickHandler = (actionItem) => {
  if (!client.value) return;

  const moveName = actionItem.action;
  if (client.value.moves[moveName]) {
    client.value.moves[moveName]();
  }
};

watch(
  () => history.value.length,
  async () => {
    await nextTick();
    scrollAreaRef.value?.scrollToBottom();
  },
  { deep: true },
);
</script>
