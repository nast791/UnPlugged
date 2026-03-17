<template>
  <aside
    class="h-full bg-black-90/70 text-slate-200 flex flex-col border-l border-white/10 shadow-2xl overflow-hidden"
  >
    <TurnTracker />

    <!-- Список игроков -->
    <div class="flex-1 overflow-y-auto p-16 space-y-16">
      <section
        v-for="(player, index) in players"
        :key="player.id"
        class="relative flex flex-col gap-12 transition-all"
        :class="[player.isTurn ? 'opacity-100 scale-100' : 'opacity-70 scale-[0.98]']"
      >
        <!-- Заголовок игрока -->
        <Player :item="player" :num="index + 1" />

        <!-- Герои  -->
        <div class="grid gap-12">
          <Fighter
            v-for="unit in player.fighters?.filter(i => i.type === 'hero')"
            :item="unit"
            :player="player"
            :count="player.fighters?.filter(i => i.type === 'hero')?.length"
          />
        </div>

        <!-- Помощники -->
        <div
          :class="[
            player.fighters?.filter(i => i.type === 'assistant')?.length > 0
              ? 'flex flex-col'
              : 'grid gap-12',
          ]"
        >
          <Fighter
            v-for="unit in player.fighters?.filter(i => i.type === 'assistant')"
            :count="player.fighters?.filter(i => i.type === 'assistant')?.length"
            :item="unit"
            :player="player"
          />
        </div>

        <!-- Нижний ряд: Команды и Карты -->
        <div class="grid grid-cols-3 gap-2 mt-1">
          <div class="bg-black/30 p-2 rounded-lg border border-white/5 flex flex-col items-center">
            <span class="text-lg font-mono font-bold">{{ player.deck?.length || 0 }}</span>
            <span class="text-[8px] font-black text-slate-600 uppercase tracking-tighter"
              >Колода</span
            >
          </div>

          <button
            @click="emit('openDiscard', player)"
            class="bg-red-500/5 hover:bg-red-500/10 p-2 rounded-lg border border-red-500/10 flex flex-col items-center transition-colors"
          >
            <span class="text-lg font-mono font-bold text-red-500">{{
              player.discard?.length || 0
            }}</span>
            <span class="text-[8px] font-black text-red-400/60 uppercase tracking-tighter"
              >Сброс</span
            >
          </button>

          <div
            v-if="player.effectImg"
            @click="emit('zoomEffect', player.effectImg)"
            class="rounded-lg overflow-hidden border border-amber-500/30 cursor-pointer hover:scale-105 transition-transform"
          >
            <img :src="player.effectImg" class="w-full h-full object-cover" />
          </div>
          <div
            v-else
            class="bg-black/30 p-2 rounded-lg border border-white/5 flex flex-col items-center opacity-20"
          >
            <span class="text-lg opacity-20">—</span>
            <span class="text-[8px] font-black text-slate-600 uppercase tracking-tighter"
              >Эффект</span
            >
          </div>
        </div>
      </section>
    </div>
  </aside>
</template>
<script setup>
import TurnTracker from '~/components/molecules/game-sidebar/TurnTracker.vue';
import Player from '~/components/molecules/game-sidebar/Player.vue';
import Fighter from '~/components/molecules/game-sidebar/Fighter.vue';
import Cards from '~/components/molecules/game-sidebar/Cards.vue';
import { useGameStore } from '~/store/game.js';

const { map, players } = storeToRefs(useGameStore());

const emit = defineEmits(['showStats', 'openDiscard', 'zoomEffect']);
</script>
